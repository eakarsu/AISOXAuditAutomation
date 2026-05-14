import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, BarChart3, FileCheck, AlertTriangle, ClipboardList, Search, FileText, Users, Monitor, DollarSign, UserCheck, KeyRound, GitBranch, BookOpen, ScrollText, Target, Calendar, Scale, Bell, LogOut, Menu, X, Brain, Sparkles, Upload, Activity, FileSearch, Calculator } from 'lucide-react'
import AISidebar from './AISidebar'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/controls', label: 'Control Testing', icon: Shield },
  { path: '/risk-assessments', label: 'Risk Assessment', icon: AlertTriangle },
  { path: '/evidence', label: 'Evidence Collection', icon: Search },
  { path: '/evidence-vault', label: 'Evidence Vault', icon: Upload },
  { path: '/compliance', label: 'Compliance Checklist', icon: ClipboardList },
  { path: '/deficiencies', label: 'Deficiency Tracking', icon: FileCheck },
  { path: '/walkthroughs', label: 'Walkthroughs', icon: FileText },
  { path: '/management-reviews', label: 'Management Review', icon: Users },
  { path: '/itgc', label: 'IT General Controls', icon: Monitor },
  { path: '/financial-reviews', label: 'Financial Review', icon: DollarSign },
  { path: '/sod-reviews', label: 'Segregation of Duties', icon: UserCheck },
  { path: '/access-reviews', label: 'Access Control', icon: KeyRound },
  { path: '/change-requests', label: 'Change Management', icon: GitBranch },
  { path: '/audit-reports', label: 'Audit Reports', icon: BookOpen },
  { path: '/policies', label: 'Policy Management', icon: ScrollText },
  { path: '/remediations', label: 'Remediation Tracking', icon: Target },
  { path: '/audit-plans', label: 'Audit Planning', icon: Calendar },
  { path: '/materiality', label: 'Materiality Assessment', icon: Scale },
  { path: '/incidents', label: 'Incident Management', icon: Bell },
  { path: '/workpaper-review', label: 'PCAOB Workpaper Review', icon: FileSearch },
  { path: '/controls-monitor', label: 'Controls Monitor', icon: Activity },
  { path: '/regulatory-update', label: 'Regulatory Updates', icon: Bell },
  { path: '/sampling-recommendation', label: 'Sampling Recommendation', icon: Calculator },
  { path: '/evidence-quality', label: 'Evidence Quality', icon: FileSearch },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">SOX Audit AI</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* AI Assistant Button in sidebar */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              aiSidebarOpen
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-200'
                : 'bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 hover:from-primary-100 hover:to-purple-100 border border-primary-200'
            }`}
            title="AI Assistant"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${aiSidebarOpen ? 'bg-white/20' : 'bg-gradient-to-br from-primary-500 to-purple-600'}`}>
              <Brain className={`w-4 h-4 ${aiSidebarOpen ? 'text-white' : 'text-white'}`} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 text-left">
                <span className="block leading-tight">AI Assistant</span>
                <span className={`text-[10px] ${aiSidebarOpen ? 'text-white/70' : 'text-primary-500'}`}>6 AI Tools Available</span>
              </div>
            )}
            {sidebarOpen && <Sparkles className={`w-4 h-4 ${aiSidebarOpen ? 'text-white/70' : 'text-purple-400'}`} />}
          </button>
        </div>

        <div className="px-2 py-1">
          <div className="border-b border-gray-100"></div>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen && <p className="text-xs text-gray-500 mb-2 truncate">{user.email}</p>}
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Floating AI button (always visible) */}
      {!aiSidebarOpen && (
        <button
          onClick={() => setAiSidebarOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full shadow-lg shadow-primary-300 flex items-center justify-center hover:scale-110 transition-transform z-40 group"
          title="Open AI Assistant"
        >
          <Brain className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* AI Sidebar */}
      <AISidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
    </div>
  )
}
