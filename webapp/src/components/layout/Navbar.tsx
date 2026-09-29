import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { useAuth } from '../../context/AuthContext';
export type WorkspaceView = 'dashboard' | 'generate' | 'monitoring';
interface NavbarProps { activeTab:WorkspaceView; onSelectTab:(tab:WorkspaceView)=>void; collapsed:boolean; onToggle:()=>void; }
export function Navbar({activeTab,onSelectTab,collapsed,onToggle}:NavbarProps) {
 const {user,logout}=useAuth();
 return <aside className={`workspace-nav ${collapsed?'is-collapsed':''}`}>
  <div className="nav-brand"><div className="brand-icon"><BrandMark/></div><div className="nav-copy"><div className="brand-name">EcoGuard<span>®</span></div><div className="brand-sub">CONSERVATION WORKSPACE</div></div></div>
  <button className="workspace-switch nav-copy" onClick={()=>onSelectTab('dashboard')}><span className="workspace-monogram">EG</span><span>Wildlife operations<small>Sri Lanka</small></span><Icon name="chevron" size={15}/></button>
  <div className="nav-section-label nav-copy">WORKSPACE</div>
  <nav aria-label="Main navigation">{([{id:'dashboard',label:'Overview',icon:'grid'},{id:'generate',label:'Report studio',icon:'report'},{id:'monitoring',label:'Wildlife monitoring',icon:'radar'}] as const).map(item=><button key={item.id} className={`rail-link ${activeTab===item.id?'active':''}`} onClick={()=>onSelectTab(item.id)} aria-current={activeTab===item.id?'page':undefined} title={item.label}><Icon name={item.icon}/><span className="nav-copy">{item.label}</span>{activeTab===item.id&&<span className="active-indicator nav-copy"/>}</button>)}</nav>
  <div className="nav-field-note nav-copy"><Icon name="leaf" size={25}/><p>Small insights.<br/><strong>Lasting impact.</strong></p><span>Every observation brings us closer to a protected future.</span></div>
  <div className="nav-bottom"><div className="nav-person"><span className="avatar">{user?.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><div className="nav-copy"><strong>{user?.name}</strong><small>{user?.role}</small></div><button className="icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><Icon name="logout" size={18}/></button></div><button className="collapse-nav" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed?'Expand navigation':'Collapse navigation'}><Icon name="menu" size={17}/><span className="nav-copy">Collapse navigation</span></button></div>
 </aside>
}
