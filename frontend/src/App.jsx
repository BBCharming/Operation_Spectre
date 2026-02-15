import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Video, BookOpen, User, LogOut, Upload, Play, MonitorPlay, Trash2, Youtube, CheckCircle, Brain, Code, ArrowLeft, Menu, X, Plus, ArrowRight, Link as LinkIcon, Edit, ChevronLeft, ChevronRight, DollarSign, Smartphone, ArrowUp, ArrowDown, Users, Lock, ShieldCheck, Terminal } from 'lucide-react';

const API = '/api';

const getYouTubeID = (url) => {
    if(!url) return null;
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    } catch(e) { return null; }
};

const Footer = () => (
    <div className="bg-slate-900 text-slate-500 text-[10px] py-6 text-center border-t border-slate-800 uppercase tracking-widest">
        <p>&copy; 2025 Benjamin Chaambwa | Operation Spectre: Version 0</p>
    </div>
);

const SubscriptionModal = ({ onClose, user, onConfirm }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-8 rounded-[2rem] w-full max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Smartphone size={40}/></div>
            <h2 className="text-3xl font-bold mb-2">Join Premium</h2>
            <p className="text-slate-600 mb-8">Unlock all platforms for <strong>K30/month</strong>.</p>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left mb-8">
                <p className="font-bold text-xs text-slate-400 uppercase mb-3">Instructions</p>
                <p className="text-sm text-slate-700">Send <b>K30</b> via Mobile Money to <b>096xxxxxxx (Benjamin)</b>. Use Ref: <b>Sub {user.name}</b></p>
            </div>
            <button onClick={onConfirm} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg">I Have Paid</button>
            <button onClick={onClose} className="mt-4 text-slate-400 text-sm hover:underline">Maybe Later</button>
        </div>
    </div>
);

const LandingPage = ({ setView }) => (
  <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
    <nav className="flex justify-between items-center p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2 text-indigo-700 font-bold text-2xl tracking-tighter"><Brain size={32}/> The Charming Programmer</div>
      <button onClick={()=>setView('login')} className="bg-indigo-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Student Login</button>
    </nav>
    <div className="text-center mt-20 px-6 flex-1">
      <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight">Master Code.<br/><span className="text-indigo-600">Charm the Future.</span></h1>
      <div className="prose prose-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium">
        <p>Benjamin here. I guide CBU students from zero to writing their first professional programs.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button onClick={()=>setView('register')} className="bg-indigo-600 text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3">Start Learning <ArrowRight/></button>
        <button onClick={()=>setView('login')} className="bg-white text-indigo-600 border-2 border-indigo-50 white px-12 py-5 rounded-full text-xl font-bold hover:bg-slate-50 transition-all">Manager Access</button>
      </div>
    </div>
    <Footer />
  </div>
);

const CloudIDE = () => {
    const [code, setCode] = useState('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Charming platform$ Ready.");\n  }\n}');
    const [lang, setLang] = useState('java');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const run = async () => {
        setLoading(true); setOutput('Compiling...');
        try { const res = await axios.post(`${API}/compile`, { language: lang, code, input }); setOutput(res.data.output); } catch (e) { setOutput('Error.'); }
        finally { setLoading(false); }
    };
    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
            <div className="p-3 bg-[#2d2d2d] flex justify-between items-center border-b border-black">
                <select className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs outline-none" value={lang} onChange={e=>setLang(e.target.value)}><option value="cpp">C++</option><option value="java">Java</option></select>
                <button onClick={run} disabled={loading} className="bg-green-600 text-white px-8 py-1 rounded-lg text-xs font-bold hover:bg-green-500 transition-all">{loading ? '...' : 'RUN'}</button>
            </div>
            <div className="flex-1"><Editor height="100%" theme="vs-dark" language={lang} value={code} onChange={setCode} options={{fontSize:15, minimap:{enabled:false}, automaticLayout: true}} /></div>
            <div className="h-1/3 bg-black flex flex-col md:flex-row border-t border-slate-800">
                <textarea className="flex-1 bg-black text-slate-400 p-4 text-sm font-mono outline-none resize-none border-r border-slate-800" placeholder="Input..." value={input} onChange={e=>setInput(e.target.value)} />
                <div className="flex-1 bg-black text-green-500 p-4 text-sm font-mono overflow-auto"><span className="text-indigo-400 font-bold">Charming platform$ </span><pre className="inline whitespace-pre-wrap">{output}</pre></div>
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

    const load = () => axios.get(`${API}/courses/${courseId}`).then(res => { setCourse(res.data); if(!activeItem) setActiveItem(res.data.videos?.[0]); });
    useEffect(() => { load(); }, [courseId]);

    const uploadVideo = async (file) => {
        if(!file) return;
        const fd = new FormData(); fd.append('file', file); fd.append('courseId', courseId); fd.append('title', file.name);
        setProgress(1);
        await axios.post(`${API}/upload`, fd, { onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total)) });
        setTimeout(() => setProgress(0), 1000); load();
    };

    if(!course) return null;
    const isSub = user.role === 'manager' || user.subscription_status === 'active';

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-50">
                <div className="flex items-center gap-4"><button onClick={onExit}><ArrowLeft/></button><span className="font-bold text-sm tracking-tight">{course.title}</span></div>
                <div className="flex gap-2">
                    <button onClick={()=>setTab('video')} className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${tab==='video'?'bg-indigo-600 shadow-lg shadow-indigo-900/40':'text-slate-500'}`}>LEARN</button>
                    <button onClick={()=>setTab('ide')} className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${tab==='ide'?'bg-indigo-600 shadow-lg shadow-indigo-900/40':'text-slate-500'}`}>IDE</button>
                    <button onClick={()=>setSidebar(!sidebar)} className="ml-2 hover:text-indigo-400">{sidebar ? <ChevronRight/> : <Menu/>}</button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black">{tab === 'ide' ? <CloudIDE /> : activeItem?.filename === 'YouTube' ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeID(activeItem.path)}`} allowFullScreen /> : <video src={activeItem?.path} className="w-full h-full object-contain" controls />}</div>
                <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-500 z-40 ${sidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                    {user.role === 'manager' && (
                        <div className="p-6 bg-indigo-950/40 border-b border-indigo-900">
                            <div className="flex gap-2">
                                <button onClick={async ()=>{const t=prompt("Title:"); const u=prompt("URL:"); if(t&&u){await axios.post(`${API}/videos/link`,{courseId,title:t,url:u});load();}}} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black">ADD LINK</button>
                                <label className="flex-1 bg-slate-800 py-2.5 rounded-xl text-[10px] font-black text-center cursor-pointer">UPLOAD <input type="file" hidden onChange={(e)=>uploadVideo(e.target.files[0])}/></label>
                            </div>
                            {progress > 0 && <div className="mt-4 bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full transition-all" style={{width:`${progress}%`}}></div></div>}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/50">Curriculum</div>
                        {course.videos?.map((v, i) => (
                            <div key={v.id} onClick={() => { if(!isSub && i > 0) alert("Version 0: Premium Required"); else {setActiveItem(v); if(window.innerWidth < 768) setSidebar(false); }}} className={`p-5 border-b border-slate-800/50 group cursor-pointer hover:bg-slate-800/40 transition-colors ${activeItem?.id === v.id ? 'bg-indigo-950/20' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {(!isSub && i > 0) ? <Lock size={16} className="text-slate-700"/> : <Play size={16} className={`${activeItem?.id===v.id?'text-indigo-400':'text-slate-600'}`}/>}
                                        <span className={`text-xs ${activeItem?.id === v.id ? 'text-white font-bold' : 'text-slate-400'}`}>{v.title}</span>
                                    </div>
                                    {user.role === 'manager' && (
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={async (e)=>{e.stopPropagation(); await axios.put(`${API}/videos/reorder`,{videoId:v.id,direction:'up'});load();}}><ArrowUp size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); if(confirm("Delete?")){await axios.delete(`${API}/videos/${v.id}`);load();}}} className="text-red-500"><Trash2 size={14}/></button>
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

const Dashboard = ({ user, logout, onJoinCourse, setView }) => {
    const [courses, setCourses] = useState([]); const [activeTab, setActiveTab] = useState('courses'); const [users, setUsers] = useState([]);
    const load = () => { axios.get(`${API}/courses`).then(res => setCourses(res.data)); if(user.role==='manager') axios.get(`${API}/users`).then(res => setUsers(res.data)); };
    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10 shrink-0 shadow-sm">
                <div className="font-black text-indigo-700 flex items-center gap-2 text-xl tracking-tighter"><Brain size={24}/> Spectre</div>
                <div className="flex gap-6 items-center">
                    {user?.role==='manager' && (
                        <div className="flex bg-slate-100 p-1 rounded-full">
                            <button onClick={()=>setActiveTab('courses')} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition ${activeTab==='courses'?'bg-white shadow-sm text-indigo-600':'text-slate-400'}`}>PLATFORMS</button>
                            <button onClick={()=>setActiveTab('students')} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition ${activeTab==='students'?'bg-white shadow-sm text-indigo-600':'text-slate-400'}`}>STUDENTS</button>
                        </div>
                    )}
                    <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={22}/></button>
                </div>
            </nav>

            <div className="p-8 md:p-16 max-w-7xl mx-auto w-full flex-1">
                {activeTab === 'courses' ? (
                    <>
                        <h2 className="text-4xl font-black mb-12 text-slate-900 tracking-tight">Active Platforms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(c=>(
                                <div key={c.id} onClick={()=>onJoinCourse(c.id)} className="group relative bg-white border border-slate-100 p-10 rounded-[3rem] cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all"><MonitorPlay size={32}/></div>
                                    <h3 className="font-bold text-2xl text-slate-900 mb-2">{c.title}</h3>
                                    <p className="text-slate-400 text-sm font-medium">{c.videoCount} Lessons Locked & Loaded</p>
                                    {user.role==='manager' && (
                                        <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={async (e)=>{e.stopPropagation(); const t=prompt("New Title:",c.title); if(t){await axios.put(`${API}/courses/${c.id}`,{title:t});load();}}} className="p-2 bg-slate-50 rounded-full hover:text-indigo-600"><Edit size={18}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); if(confirm("Destroy Platform?")){await axios.delete(`${API}/courses/${c.id}`);load();}}} className="p-2 bg-slate-50 rounded-full hover:text-red-600"><Trash2 size={18}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {user?.role==='manager' && (
                                <div className="border-4 border-dashed border-slate-100 rounded-[3rem] flex items-center justify-center h-64 text-slate-200 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer" onClick={async ()=>{const t=prompt("New Platform Name:"); if(t){await axios.post(`${API}/courses`,{title:t});load();}}}><Plus size={64}/></div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-3xl font-black mb-10 tracking-tight">Student Roster</h2>
                        <div className="space-y-4">
                            {users.map(u => (
                                <div key={u.id} className="p-6 border border-slate-50 rounded-3xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div><p className="font-black text-slate-900 text-lg">{u.name}</p><p className="text-sm text-slate-400 font-bold">{u.email} • {u.phone || 'No Phone'}</p></div>
                                    <button onClick={async ()=>{await axios.post(`${API}/users/${u.id}/${u.subscription_status==='active'?'revoke':'approve'}`);load();}} className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest ${u.subscription_status==='active'?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>{u.subscription_status==='active'?'REVOKE':'APPROVE'}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default function App() {
    const [view, setView] = useState('landing'); const [user, setUser] = useState(null); const [activeId, setActiveId] = useState(null);
    const [auth, setAuth] = useState({ email: '', password: '', name: '', phone: '', isLogin: true });

    useEffect(() => {
        const t = localStorage.getItem('token');
        if (t) { axios.defaults.headers.common['Authorization'] = `Bearer ${t}`; axios.get(`${API}/auth/me`).then(res => { setUser(res.data); setView('dashboard'); }).catch(()=>{localStorage.clear()}); }
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        try { const res = await axios.post(`${API}/auth/${auth.isLogin?'login':'register'}`, auth); localStorage.setItem('token', res.data.token); axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`; setUser(res.data.user); setView('dashboard'); } 
        catch (err) { alert(err.response?.data?.error || "Error"); }
    };

    if (view === 'classroom') return <Classroom courseId={activeId} user={user} onExit={()=>setView('dashboard')} />;
    if (view === 'dashboard') return <Dashboard user={user} logout={()=>{localStorage.clear(); setView('landing')}} setView={setView} onJoinCourse={(id)=>{setActiveId(id); setView('classroom')}} />;
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            {view === 'landing' ? <LandingPage setView={setView}/> : (
                <form onSubmit={handleAuth} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md border border-slate-50 animate-in zoom-in-95 duration-500">
                    <h2 className="text-4xl font-black mb-10 text-center tracking-tighter">{auth.isLogin?'Welcome Back.':'Join the Class.'}</h2>
                    {!auth.isLogin && <input className="w-full p-5 bg-slate-50 rounded-3xl mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Full Name" onChange={e=>setAuth({...auth, name:e.target.value})}/>}
                    <input className="w-full p-5 bg-slate-50 rounded-3xl mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Email Address" onChange={e=>setAuth({...auth, email:e.target.value})}/>
                    {!auth.isLogin && <input className="w-full p-5 bg-slate-50 rounded-3xl mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Phone (e.g. 097...)" onChange={e=>setAuth({...auth, phone:e.target.value})}/>}
                    <input className="w-full p-5 bg-slate-50 rounded-3xl mb-10 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" type="password" placeholder="Password" onChange={e=>setAuth({...auth, password:e.target.value})}/>
                    <button className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all tracking-widest uppercase">CONTINUE</button>
                    <p className="mt-8 text-center text-xs text-indigo-600 cursor-pointer font-black tracking-widest uppercase" onClick={()=>setAuth({...auth, isLogin:!auth.isLogin})}>{auth.isLogin?'Create Account':'Existing Member'}</p>
                </form>
            )}
        </div>
    );
}
