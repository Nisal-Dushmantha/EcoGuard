import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Navbar } from './components/layout/Navbar';
import type { WorkspaceView } from './components/layout/Navbar';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { Icon } from './components/layout/Icon';
import { Landscape } from './components/layout/Landscape';
import { ConservationModule } from './components/analytics';
import './workspace.css';
function MainApplication(){
 const {user,isAuthenticated,isLoading}=useAuth();
 const [authView,setAuthView]=useState<'login'|'register'>('login');
 const [view,setView]=useState<WorkspaceView>('dashboard');
 const [collapsed,setCollapsed]=useState(false);
 if(isLoading)return <div className="auth-wrapper"><span className="spinner"/><span className="loading-label">Opening your workspace…</span></div>;
 if(!isAuthenticated||!user)return authView==='login'?<LoginPage onSwitchToRegister={()=>setAuthView('register')}/>:<RegisterPage onSwitchToLogin={()=>setAuthView('login')}/>;
 return <div className={`app-shell ${collapsed?'nav-compact':''}`}>
  <a className="skip-link" href="#main-content">Skip to content</a>
  <Navbar activeTab={view} onSelectTab={setView} collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)}/>
  <div className="workspace-body"><header className="command-bar no-print"><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13}/><strong>{view==='dashboard'?'Overview':view==='generate'?'Report studio':'Wildlife monitoring'}</strong></div><div className="command-actions"><span className="command-date">{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span><ThemeToggle/><span className="command-park"><Icon name="pin" size={15}/>{user.assignedPark}</span></div></header>
  <main className="app-main" id="main-content">
   <div hidden={view==='monitoring'}><ConservationModule userPark={user.assignedPark} userName={user.name} view={view==='generate'?'generate':'dashboard'} onChangeView={setView}/></div>
   {view==='monitoring'&&<section className="monitoring-state"><div className="section-kicker">THE NEXT CHAPTER</div><h1>Closer to the wild.</h1><p>Animal tracking is on the horizon. This workspace will bring collar activity and wildlife movement into view.</p><div className="coming-soon"><Icon name="radar"/>Monitoring · Coming soon</div><div className="monitoring-landscape"><Landscape/></div><button className="btn-primary" onClick={()=>setView('dashboard')}>Explore conservation insights<Icon name="arrow" size={17}/></button></section>}
  </main><footer className="workspace-footer no-print"><span>EcoGuard / Wildlife intelligence</span><span>Observe. Understand. Protect.</span></footer></div>
 </div>
}
export function App(){return <ThemeProvider><AuthProvider><MainApplication/></AuthProvider></ThemeProvider>}
export default App;
