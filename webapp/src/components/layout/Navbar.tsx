import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";
import { useAuth } from "../../context/AuthContext";

export type WorkspaceView = "monitoring" | "dashboard" | "generate";

interface NavbarProps {
  activeTab: WorkspaceView;
  onSelectTab: (tab: WorkspaceView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggle,
}: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className={`workspace-nav ${collapsed ? "is-collapsed" : ""}`}>
      {/* Floating edge slide in / slide out arrow toggle */}
      <button
        type="button"
        className="nav-edge-toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar navigation (slide out)" : "Collapse sidebar navigation (slide in)"}
        title={collapsed ? "Expand navigation (Slide out)" : "Collapse navigation (Slide in)"}
      >
        <span className={`toggle-chevron ${collapsed ? "is-collapsed" : ""}`}>
          <Icon name="chevron" size={14} />
        </span>
      </button>

      <div className="workspace-nav-inner">
        <div className="nav-brand">
          <div className="brand-icon">
            <BrandMark />
          </div>
          <div className="nav-copy">
            <div className="brand-name">
              EcoGuard<span>®</span>
            </div>
            <div className="brand-sub">PARK OPERATIONS WORKSPACE</div>
          </div>
        </div>

        <button
          className="workspace-switch nav-copy"
          onClick={() => onSelectTab("monitoring")}
        >
          <span className="workspace-monogram">EG</span>
          <span>
            Wildlife operations<small>{user?.assignedPark || "Sri Lanka"}</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>

        <div className="nav-section-label nav-copy">OPERATIONS MODULES</div>

        <nav aria-label="Main navigation">
          {(
            [
              { id: "monitoring", label: "Wildlife Monitoring", icon: "radar" },
              { id: "dashboard", label: "Conservation Overview", icon: "grid" },
              { id: "generate", label: "Report Studio", icon: "report" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`rail-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={activeTab === item.id ? "page" : undefined}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span className="nav-copy">{item.label}</span>
              {activeTab === item.id && (
                <span className="active-indicator nav-copy" />
              )}
            </button>
          ))}
        </nav>

        <div className="nav-field-note nav-copy">
          <Icon name="leaf" size={25} />
          <p>
            Observe. Protect.
            <br />
            <strong>Safeguard Wildlife.</strong>
          </p>
          <span>Real-time GPS collar telemetry & geofence threat mitigation.</span>
        </div>

        <div className="nav-bottom">
          <div className="nav-person">
            <span className="avatar">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                : "PM"}
            </span>
            <div className="nav-copy">
              <strong>{user?.name || "Park Manager"}</strong>
              <small>{user?.role || "Park Manager"}</small>
            </div>
            <button
              className="icon-button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>

          <button
            type="button"
            className="collapse-nav"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <span className={`toggle-chevron ${collapsed ? "is-collapsed" : ""}`}>
              <Icon name="chevron" size={15} />
            </span>
            <span className="nav-copy">
              {collapsed ? "Expand navigation" : "Collapse navigation"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
