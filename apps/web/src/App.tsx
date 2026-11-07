import { useEffect, useState } from "react";
import { Utensils, ClipboardList, ChefHat, CreditCard, Settings, Plus, Bell, CircleCheck, Clock3, Users, TrendingUp } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
type Health = "checking" | "online" | "offline";

export default function App() {
  const [health, setHealth] = useState<Health>("checking");
  const [tab, setTab] = useState("Visão geral");
  useEffect(() => {
    fetch(`${apiUrl}/health`).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => setHealth("online")).catch(() => setHealth("offline"));
  }, []);

  const nav = [
    { label: "Visão geral", icon: TrendingUp }, { label: "Comandas", icon: ClipboardList },
    { label: "Cozinha e bar", icon: ChefHat }, { label: "Cardápio", icon: Utensils },
    { label: "Pagamentos", icon: CreditCard }, { label: "Configurações", icon: Settings },
  ];
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Utensils size={21}/></div><div><strong>Comanda Fácil</strong><small>PAINEL DO ESTABELECIMENTO</small></div></div>
      <div className="workspace"><span className="avatar">B</span><div><b>Meu estabelecimento</b><small>Plano inicial</small></div><span className="chevron">⌄</span></div>
      <span className="section-label">MENU PRINCIPAL</span>
      <nav>{nav.map(n => <button key={n.label} className={tab===n.label?"nav-item active":"nav-item"} onClick={()=>setTab(n.label)}><n.icon size={18}/>{n.label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user"><span className="avatar user-avatar">G</span><div><b>Administrador</b><small>Perfil administrador</small></div><span className="chevron">···</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Estabelecimento <span>/</span> {tab}</div><div className="top-actions"><span className={health==="online"?"status online":"status"}><i/>API {health==="checking"?"verificando":health==="online"?"conectada":"desconectada"}</span><button className="icon-btn" aria-label="Notificações"><Bell size={19}/></button><span className="avatar top-avatar">G</span></div></header>
      <div className="content">
        <div className="heading"><div><p className="eyebrow">SEXTA-FEIRA, OPERAÇÃO DO DIA</p><h1>{tab}</h1><p className="subtitle">Acompanhe a operação do seu bar em tempo real.</p></div><button className="primary"><Plus size={18}/> Nova comanda</button></div>
        <section className="metrics">
          <Metric title="Comandas abertas" value="0" note="Nenhuma em andamento" icon={<ClipboardList/>}/>
          <Metric title="Pedidos em preparo" value="0" note="Cozinha e bar" icon={<ChefHat/>}/>
          <Metric title="Vendas do dia" value="R$ 0,00" note="Atualizado agora" icon={<TrendingUp/>}/>
          <Metric title="Clientes atendidos" value="0" note="No dia de hoje" icon={<Users/>}/>
        </section>
        <section className="quick-grid">
          <div className="panel orders"><div className="panel-head"><div><h2>Comandas recentes</h2><p>Últimas movimentações do estabelecimento</p></div><button className="text-btn" onClick={()=>setTab("Comandas")}>Ver todas <span>→</span></button></div>
            <div className="empty"><div className="empty-icon"><ClipboardList size={25}/></div><b>Nenhuma comanda por enquanto</b><p>Quando uma comanda for aberta, ela aparecerá aqui.</p><button className="outline" onClick={()=>setTab("Comandas")}><Plus size={16}/> Abrir primeira comanda</button></div>
          </div>
          <div className="panel activity"><div className="panel-head"><div><h2>Visão da operação</h2><p>Status das estações</p></div></div>
            <div className="station"><span className="station-icon"><ChefHat size={18}/></span><div><b>Cozinha</b><small>Fila de preparo</small></div><span className="count">0 pedidos</span></div>
            <div className="station"><span className="station-icon bar"><Utensils size={18}/></span><div><b>Bar</b><small>Fila de preparo</small></div><span className="count">0 pedidos</span></div>
            <div className="operation-note"><CircleCheck size={17}/><span>Pronto para iniciar o atendimento</span></div>
          </div>
        </section>
        <div className="footer-note"><Clock3 size={14}/> Os dados serão exibidos assim que a API e o banco forem configurados.</div>
      </div>
    </main>
  </div>;
}
function Metric({title,value,note,icon}:{title:string;value:string;note:string;icon:React.ReactNode}) {
  return <article className="metric"><div className="metric-top"><span>{title}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></article>;
}
