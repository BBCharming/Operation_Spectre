import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
  Video, LogOut, Upload, Play, MonitorPlay, Trash2, Brain, 
  ArrowLeft, Menu, X, Plus, Link as LinkIcon, Lock, 
  ChevronRight, Edit, ArrowUp, ArrowDown, Terminal 
} from 'lucide-react';

const API = '/api';

const getYouTubeID = (url) => {
    if(!url) return null;
    try { 
      const r = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/; 
      const m = url.match(r); 
      return (m && m[2].length === 11) ? m[2] : null; 
    } catch(e) { return null; }
};

const CloudIDE = () => {
    const [code, setCode] = useState('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Charming platform$ Ready.");\n  }\n}');
    const [lang, setLang] = useState('java');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true); setOutput('Compiling...');
        try {
            const res = await axios.post(`${API}/compile`, { language: lang, code, input });
            setOutput(res.data.output);
        } catch (e) { setOutput('Error connecting to compiler.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
            <div className="p-2 bg-[#2d2d2d] flex justify-between items-center border-b border-black shrink-0">
                <select 
                  className="bg-slate-700 text-white px-2 py-1 rounded text-xs" 
                  value={lang} 
                  onChange={e=>setLang(e.target.value)}
                >
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                </select>
                <button 
                  onClick={run} 
                  disabled={loading} 
                  className="bg-green-600 text-white px-6 py-1 rounded text-xs font-bold active:scale-95 transition-all"
                >
                  {loading ? '...' : 'RUN'}
                </button>
            </div>
            <div className="flex-1 min-h-0">
                <Editor 
                  height="100%" 
                  theme="vs-dark" 
                  language={lang} 
                  value={code} 
                  onChange={setCode} 
                  options={{fontSize:14, minimap:{enabled:false}, automaticLayout: true}} 
                />
            </div>
            <div className="h-1/3 bg-black flex flex-col md:flex-row border-t border-slate-800 shrink-0">
                <textarea 
                  className="flex-1 bg-black text-slate-400 p-3 text-xs font-mono outline-none resize-none border-r border-slate-800" 
                  placeholder="Standard Input..." 
                  value={input} 
                  onChange={e=>setInput(e.target.value)} 
                />
                <div className="flex-1 bg-black text-green-500 p-3 text-xs font-mono overflow-auto">
                    <span className="text-indigo-400">Charming platform$ </span>
                    <pre className="inline">{output}</pre>
                </div>
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

    const load = () => axios.get(`${API}/courses/${courseId}`).then(res => { 
      setCourse(res.data); 
      if(!activeItem) setActiveItem(res.data.videos?.[0]); 
    });

    useEffect(() => { load(); }, [courseId]);

    const addLink = async () => {
        const title = prompt("Lesson Title:");
        const url = prompt("YouTube URL:");
        if(title && url) { 
          await axios.post(`${API}/videos/link`, { courseId, title, url }); 
          load(); 
        }
    };

    const uploadVideo = async (file) => {
        if(!file) return;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('courseId', courseId);
        fd.append('title', file.name);
        setProgress(1);
        await axios.post(`${API}/upload`, fd, {
            onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
        });
        setTimeout(() => setProgress(0), 1000);
        load();
    };

    const reorder = async (videoId, direction) => { 
      await axios.put(`${API}/videos/reorder`, { videoId, direction }); 
      load(); 
    };

    const rename = async (id, old) => { 
      const t = prompt("Rename to:", old); 
      if(t) { await axios.put(`${API}/videos/${id}`, {title:t}); load(); }
    };

    const del = async (id) => { 
      if(confirm("Delete lesson?")) { await axios.delete(`${API}/videos/${id}`); load(); } 
    };

    if(!course) return null;
    const isSub = user.role === 'manager' || user.subscription_status === 'active';

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-50 shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={onExit}><ArrowLeft/></button>
                  <span className="font-bold text-xs truncate max-w-[120px]">{course.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={()=>setTab('video')} 
                      className={`px-4 py-1 rounded-full text-[10px] font-bold ${tab==='video'?'bg-indigo-600':'text-slate-500'}`}
                    >
                      LEARN
                    </button>
                    <button 
                      onClick={()=>setTab('ide')} 
                      className={`px-4 py-1 rounded-full text-[10px] font-bold ${tab==='ide'?'bg-indigo-600':'text-slate-500'}`}
                    >
                      IDE
                    </button>
                    <button onClick={()=>setSidebar(!sidebar)} className="ml-2">
                      {sidebar ? <ChevronRight/> : <Menu/>}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black">
                    {tab === 'ide' ? <CloudIDE /> : 
                     activeItem?.filename === 'YouTube' ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeID(activeItem.path)}`} allowFullScreen /> :
                     <video src={activeItem?.path} className="w-full h-full object-contain" controls />}
                </div>

                <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 z-40 ${sidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                    {user.role === 'manager' && (
                        <div className="p-4 bg-indigo-950/40 border-b border-indigo-900 shrink-0">
                            <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-widest">Manager Tools</div>
                            <div className="flex gap-2">
                                <button onClick={addLink} className="flex-1 bg-indigo-600 text-white py-2 rounded text-[10px] font-bold">ADD LINK</button>
                                <label className="flex-1 bg-slate-800 py-2 rounded text-[10px] font-bold text-center cursor-pointer">
                                    UPLOAD <input type="file" hidden onChange={(e)=>uploadVideo(e.target.files[0])}/>
                                </label>
                            </div>
                            {progress > 0 && (
                                <div className="mt-3 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full transition-all" style={{width: `${progress}%`}}></div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Content</div>
                        {course.videos?.map((v, i) => (
                            <div key={v.id} onClick={() => { if(!isSub && i > 0) alert("Premium Required"); else setActiveItem(v); }} className={`p-4 border-b border-slate-800/50 group cursor-pointer ${activeItem?.id === v.id ? 'bg-indigo-900/10' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {(!isSub && i > 0) ? <Lock size={14} className="text-slate-600"/> : <Play size={14} className="text-indigo-400"/>}
                                        <span className={`text-xs ${activeItem?.id === v.id ? 'text-white font-bold' : 'text-slate-400'}`}>{v.title}</span>
                                    </div>
                                    {user.role === 'manager' && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e)=>{e.stopPropagation(); reorder(v.id, 'up')}}><ArrowUp size={12}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); reorder(v.id, 'down')}}><ArrowDown size={12}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); rename(v.id, v.title)}}><Edit size={12}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); del(v.id)}} className="text-red-500"><Trash2 size={12}/></button>
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

const AdminPanel = ({ onExit }) => {
    const [users, setUsers] = useState([]);
    useEffect(() => { axios.get(`${API}/users`).then(res => setUsers(res.data)); }, []);
    const act = (id, cur) => axios.post(`${API}/users/${id}/${cur==='active'?'revoke':'approve'}`).then(()=>axios.get(`${API}/users`).then(res => setUsers(res.data)));
    return (
        <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold">Students</h2><button onClick={onExit}><X/></button></div>
                <div className="space-y-4">{users.map(u => (
                  <div key={u.id} className="p-4 border rounded-2xl flex justify-between items-center">
                    <div><p className="font-bold text-sm">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                    <button onClick={()=>act(u.id, u.subscription_status)} className={`px-4 py-1 rounded-lg text-xs font-bold ${u.subscription_status==='active'?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>
                      {u.subscription_status==='active'?'REVOKE':'APPROVE'}
                    </button>
                  </div>
                ))}</div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, logout, onJoinCourse, setView }) => {
    const [courses, setCourses] = useState([]);
    const load = () => axios.get(`${API}/courses`).then(res => setCourses(res.data));
    useEffect(() => { load(); }, []);
    const del = async (id) => { if(confirm("Delete entire course?")) { await axios.delete(`${API}/courses/${id}`); load(); } };
    const ren = async (id, old) => { 
      const t = prompt("Rename course to:", old); 
      if(t) { await axios.put(`${API}/courses/${id}`, {title:t}); load(); }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 shrink-0">
              <div className="font-bold text-indigo-600 flex items-center gap-2"><Brain size={20}/> Spectre</div>
              <div className="flex gap-4 items-center">
                {user?.role==='manager' && <button onClick={()=>setView('admin')} className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">ADMIN</button>}
                <button onClick={logout}><LogOut size={20} className="text-slate-400"/></button>
              </div>
            </nav>
            <div className="p-8 max-w-6xl mx-auto flex-1 w-full">
              <h2 className="text-3xl font-bold mb-8 text-slate-900 tracking-tight">Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {courses.map(c=>(
                    <div key={c.id} onClick={()=>onJoinCourse(c.id)} className="group relative bg-white border border-slate-200 p-8 rounded-[2.5rem] cursor-pointer hover:shadow-xl transition-all">
                      <MonitorPlay className="text-indigo-600 mb-4" size={32}/><h3 className="font-bold text-lg">{c.title}</h3>
                      {user.role==='manager' && (
                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={(e)=>{e.stopPropagation(); ren(c.id, c.title)}}><Edit size={16} className="text-slate-300 hover:text-indigo-600"/></button>
                          <button onClick={(e)=>{e.stopPropagation(); del(c.id)}}><Trash2 size={16} className="text-slate-300 hover:text-red-500"/></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {user?.role==='manager' && (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center h-48 text-slate-300 hover:text-indigo-600 hover:border-indigo-600 transition cursor-pointer" onClick={()=>{const t=prompt("Title:"); if(t) axios.post(`${API}/courses`, {title:t}).then(()=>load())}}><Plus size={40}/></div>
                  )}
              </div>
            </div>
            <div className="p-4 text-center text-[10px] text-slate-400 border-t bg-white uppercase tracking-widest">© 2025 Benjamin Chaambwa | Spectre v7.6</div>
        </div>
    );
};

export default function App() {
    const [view, setView] = useState('landing');
    const [user, setUser] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [auth, setAuth] = useState({ email: '', password: '', name: '', isLogin: true });

    useEffect(() => {
        const t = localStorage.getItem('token');
        if (t) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
            axios.get(`${API}/auth/me`).then(res => { setUser(res.data); setView('dashboard'); }).catch(()=>{localStorage.clear()});
        }
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/auth/${auth.isLogin?'login':'register'}`, auth);
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data.user); setView('dashboard');
        } catch (err) { alert("Invalid Credentials"); }
    };

    if (view === 'admin') return <AdminPanel onExit={()=>setView('dashboard')} />;
    if (view === 'classroom') return <Classroom courseId={activeId} user={user} onExit={()=>setView('dashboard')} />;
    if (view === 'dashboard') return <Dashboard user={user} logout={()=>{localStorage.clear(); setView('landing')}} setView={setView} onJoinCourse={(id)=>{setActiveId(id); setView('classroom')}} />;
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            {view === 'landing' ? (
              <div className="text-center p-6">
                <Brain className="text-indigo-600 mb-4 mx-auto animate-pulse" size={80}/>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">The Charming Programmer</h1>
                <button onClick={()=>setView('login')} className="bg-indigo-600 text-white px-12 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-all text-lg tracking-widest mt-6">ENTER</button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <form onSubmit={handleAuth} className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border border-slate-100">
                    <h2 className="text-3xl font-bold mb-8 text-center tracking-tight">{auth.isLogin?'Login':'Join'}</h2>
                    {!auth.isLogin && (
                      <input className="w-full p-4 bg-slate-50 border-none rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Full Name" onChange={e=>setAuth({...auth, name:e.target.value})}/>
                    )}
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl mb-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" onChange={e=>setAuth({...auth, email:e.target.value})}/>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl mb-8 outline-none focus:ring-2 focus:ring-indigo-500" type="password" placeholder="Password" onChange={e=>setAuth({...auth, password:e.target.value})}/>
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">CONTINUE</button>
                    <p className="mt-6 text-center text-xs text-indigo-600 cursor-pointer font-bold" onClick={()=>setAuth({...auth, isLogin:!auth.isLogin})}>
                      {auth.isLogin ? 'Switch to Register' : 'Switch to Login'}
                    </p>
                </form>
              </div>
            )}
        </div>
    );
}
