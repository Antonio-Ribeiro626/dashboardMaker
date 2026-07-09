import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    CartesianGrid,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    Activity,
    BarChart3,
    Bell,
    Bot,
    BriefcaseBusiness,
    Building2,
    Calendar,
    ChevronRight,
    Command,
    Database,
    Download,
    FileDown,
    FileSpreadsheet,
    FileText,
    Filter,
    Grid3X3,
    Home,
    Loader2,
    LogOut,
    MapPin,
    Moon,
    Package,
    Plug,
    Plus,
    Search,
    Send,
    Settings,
    Shield,
    ShoppingCart,
    Sparkles,
    Sun,
    Upload,
    User,
    Users,
    WalletCards,
    X,
    Zap,
} from "lucide-react";
import "../css/app.css";

const APP_NAME = "OnBoarding";

const api = axios.create({
    baseURL: "/api",
    headers: { Accept: "application/json" },
});
const money = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const colors = ["#6d5dfc", "#1e90ff", "#12b8c8", "#31c48d", "#f59e0b"];
const resources = {
    customers: {
        label: "Clientes",
        icon: Users,
        fields: ["name", "email", "phone", "status"],
    },
    products: {
        label: "Produtos",
        icon: Package,
        fields: ["name", "category", "price", "stock"],
    },
    sales: {
        label: "Vendas",
        icon: ShoppingCart,
        fields: [
            "customer_id",
            "product_id",
            "quantity",
            "total",
            "sale_date",
            "status",
        ],
    },
    expenses: {
        label: "Despesas",
        icon: WalletCards,
        fields: ["title", "category", "amount", "expense_date"],
    },
    employees: {
        label: "Funcionarios",
        icon: Building2,
        fields: ["name", "email", "role", "department"],
    },
};

function useAuth() {
    const [token, setToken] = useState(localStorage.getItem("if_token"));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(token));
    useEffect(() => {
        api.defaults.headers.common.Authorization = token
            ? `Bearer ${token}`
            : "";
    }, [token]);
    useEffect(() => {
        if (!token) return;
        api.get("/user")
            .then(({ data }) => setUser(data))
            .catch(() => setToken(null))
            .finally(() => setLoading(false));
    }, [token]);
    const save = (data) => {
        localStorage.setItem("if_token", data.token);
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        setToken(data.token);
        setUser(data.user);
    };
    const logout = async () => {
        try {
            await api.post("/logout");
        } catch {}
        localStorage.removeItem("if_token");
        setToken(null);
        setUser(null);
    };
    return { token, user, loading, save, logout, setUser };
}

function Button({ children, variant = "primary", className = "", ...props }) {
    return (
        <button
            className={`btn ${variant === "ghost" ? "btn-ghost" : variant === "danger" ? "btn-danger" : "btn-primary"} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
function Input(props) {
    return <input className="input" {...props} />;
}
function LoadingSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-32" />
            ))}
        </div>
    );
}
function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="page-head">
            <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {actions && <div className="head-actions">{actions}</div>}
        </div>
    );
}
function Delta({ value = "+ 8.2%", tone = "subiu" }) {
    return (
        <span className={`delta ${tone}`}>
            {tone === "desceu" ? "desceu" : "subiu"} {value}{" "}
            <em>vs periodo anterior</em>
        </span>
    );
}
function AnimatedValue({ value }) {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
        const raw = String(value ?? "");
        const numeric = Number(raw.replace(/[^0-9.-]/g, ""));
        if (!Number.isFinite(numeric)) {
            setDisplay(value);
            return;
        }
        const prefix = raw.match(/^[^0-9-]*/)?.[0] || "";
        const suffix = raw.includes("%") ? "%" : "";
        const decimals = raw.includes(".") && !raw.includes("%") ? 2 : 0;
        const start = performance.now();
        const duration = 720;
        let raf = 0;
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numeric * eased;
            setDisplay(
                `${prefix}${current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
            );
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return display;
}
function StatCard({ label, value, delta = "+ 8.2%", tone = "up" }) {
    return (
        <div className="card stat-card animate-in">
            <span>{label}</span>
            <strong>
                <AnimatedValue value={value} />
            </strong>
            <Delta value={delta} tone={tone} />
        </div>
    );
}
function ChartCard({ title, subtitle, className = "", children, tag }) {
    return (
        <section className={`card chart-card ${className}`}>
            <div className="card-title">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {tag && <span className="pill">{tag}</span>}
            </div>
            <div className="chart-wrap">{children}</div>
        </section>
    );
}
function FilterBar({ right }) {
    return (
        <div className="filter-bar">
            <div className="filter-left">
                <span className="filter-label">
                    <Filter size={16} /> Filtros
                </span>
                <button>
                    <Calendar size={15} /> Este ano <ChevronRight size={14} />
                </button>
                <button>
                    <BriefcaseBusiness size={15} /> Todos os departamentos{" "}
                    <ChevronRight size={14} />
                </button>
                <button>
                    <MapPin size={15} /> Todas as regioes{" "}
                    <ChevronRight size={14} />
                </button>
            </div>
            {right || <button className="reset-btn">Repor</button>}
        </div>
    );
}
function DashboardFilters({ filters, setFilters, onReset, categories = [] }) {
    const [open, setOpen] = useState(null);
    const periods = [
        ["today", "Hoje"],
        ["month", "Este mes"],
        ["quarter", "Este trimestre"],
        ["year", "Este ano"],
    ];
    const regions = [
        "Todas as regioes",
        "Norte",
        "Sul",
        "Centro",
        "Internacional",
    ];
    const currentPeriod =
        periods.find(([v]) => v === filters.period)?.[1] || "Este ano";
    const choose = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setOpen(null);
    };
    const reset = () => {
        setOpen(null);
        onReset();
    };
    return (
        <div className="filter-bar modern-filters">
            <div className="filter-left">
                <span className="filter-label">
                    <Filter size={16} /> Filtros
                </span>
                <div className="filter-menu">
                    <button
                        type="button"
                        onClick={() =>
                            setOpen(open === "period" ? null : "period")
                        }
                    >
                        <Calendar size={15} /> {currentPeriod}{" "}
                        <ChevronRight size={14} />
                    </button>
                    {open === "period" && (
                        <div className="menu-pop">
                            {periods.map(([value, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={
                                        filters.period === value
                                            ? "selected"
                                            : ""
                                    }
                                    onClick={() => choose("period", value)}
                                >
                                    {label}
                                    <span>
                                        {filters.period === value ? "OK" : ""}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="filter-menu">
                    <button
                        type="button"
                        onClick={() =>
                            setOpen(open === "category" ? null : "category")
                        }
                    >
                        <BriefcaseBusiness size={15} />{" "}
                        {filters.category || "Todas as categorias"}{" "}
                        <ChevronRight size={14} />
                    </button>
                    {open === "category" && (
                        <div className="menu-pop">
                            {["", ...categories].map((value) => (
                                <button
                                    type="button"
                                    key={value || "all"}
                                    className={
                                        (filters.category || "") === value
                                            ? "selected"
                                            : ""
                                    }
                                    onClick={() => choose("category", value)}
                                >
                                    {value || "Todas as categorias"}
                                    <span>
                                        {(filters.category || "") === value
                                            ? "OK"
                                            : ""}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="filter-menu">
                    <button
                        type="button"
                        onClick={() =>
                            setOpen(open === "region" ? null : "region")
                        }
                    >
                        <MapPin size={15} />{" "}
                        {filters.region || "Todas as regioes"}{" "}
                        <ChevronRight size={14} />
                    </button>
                    {open === "region" && (
                        <div className="menu-pop">
                            {regions.map((value) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={
                                        (filters.region ||
                                            "Todas as regioes") === value
                                            ? "selected"
                                            : ""
                                    }
                                    onClick={() => choose("region", value)}
                                >
                                    {value}
                                    <span>
                                        {(filters.region ||
                                            "Todas as regioes") === value
                                            ? "OK"
                                            : ""}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <button type="button" className="reset-btn" onClick={reset}>
                Repor
            </button>
        </div>
    );
}
function PublicShell({ onAuth }) {
    const [authMode, setAuthMode] = useState(null);
    if (authMode)
        return (
            <AuthScreen
                mode={authMode}
                onModeChange={setAuthMode}
                onAuth={onAuth}
                onBack={() => setAuthMode(null)}
            />
        );
    return (
        <LandingPage
            onLogin={() => setAuthMode("login")}
            onRegister={() => setAuthMode("register")}
        />
    );
}
function LandingPage({ onLogin, onRegister }) {
    const features = [
        "Dashboards interativos",
        "Assistente com IA",
        "Integracoes em 1 clique",
        "Previsoes e tendencias",
        "Seguro por defeito",
        "Alertas inteligentes",
    ];
    const steps = ["Ligue os seus dados", "Crie dashboards", "Decida com IA"];
    const prices = [
        [
            "Iniciante",
            "29€",
            "Para pequenas equipas a comecar a organizar os seus dados.",
        ],
        [
            "Profissional",
            "99€",
            "Para PMEs que precisam de analises avancadas e automacao.",
        ],
        [
            "Empresas",
            "499€",
            "Para empresas que exigem escala, seguranca e personalizacao.",
        ],
    ];
    return (
        <main className="landing">
            <header className="landing-nav">
                <div className="brand mini">
                    <div className="brand-icon">
                        <Zap size={16} />
                    </div>
                    <div>
                        <strong>OnBoarding</strong>
                        <span>Inteligencia Empresarial</span>
                    </div>
                </div>
                <nav>
                    <a href="#features">Funcionalidades</a>
                    <a href="#pricing">Precos</a>
                    <a href="#faq">FAQ</a>
                </nav>
                <div>
                    <button onClick={onLogin} className="landing-link">
                        Entrar
                    </button>
                    <button onClick={onRegister} className="landing-action">
                        Conhecer planos
                    </button>
                </div>
            </header>
            <section className="landing-hero">
                <span className="eyebrow">Onboarding empresarial</span>
                <h1>
                    Toda a sua empresa, <b>num processo claro</b>
                </h1>
                <p>
                    Centralize dados de vendas, clientes e operacoes. Descubra o
                    que importa com dashboards interativos e um assistente com
                    IA.
                </p>
                <div className="hero-actions">
                    <button onClick={onRegister}>Criar conta</button>
                    <button onClick={onLogin}>Conhecer planos ao vivo</button>
                </div>
                <small>
                    Sem cartao de credito - 14 dias gratis - Cancele quando
                    quiser
                </small>
                <div className="hero-dashboard">
                    <div className="window-dots">
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>
                    <div className="hero-metrics">
                        <span>
                            Receita <b>EUR 1.28M</b>
                        </span>
                        <span>
                            Clientes <b>8.412</b>
                        </span>
                        <span>
                            Vendas <b>18.9%</b>
                        </span>
                        <span>
                            Encomendas <b>2.847</b>
                        </span>
                    </div>
                    <div className="hero-bars">
                        {[30, 42, 32, 48, 52, 44, 62, 58, 70, 78, 72].map(
                            (h, i) => (
                                <b key={i} style={{ height: `${h}%` }}></b>
                            ),
                        )}
                    </div>
                </div>
            </section>
            <section className="logo-strip">
                <span>Equipas comerciais</span>
                <span>Operacoes</span>
                <span>Financeiro</span>
                <span>Suporte</span>
                <span>Gestao</span>
                <span>Analise de dados</span>
            </section>
            <section id="features" className="landing-section">
                <span className="eyebrow">Funcionalidades</span>
                <h2>Tudo o que precisa para decidir com dados</h2>
                <p>
                    Uma plataforma completa de BI, desenhada para equipas
                    pequenas mas com ambicoes grandes.
                </p>
                <div className="landing-grid">
                    {features.map((f) => (
                        <article key={f}>
                            <div className="soft-icon">
                                <BarChart3 size={18} />
                            </div>
                            <h3>{f}</h3>
                            <p>
                                Visualize KPIs, automatize alertas e trabalhe
                                com dados reais num unico espaco.
                            </p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="landing-section compact">
                <span className="eyebrow">Como funciona</span>
                <h2>Comece em minutos</h2>
                <div className="landing-grid three">
                    {steps.map((item, i) => (
                        <article key={item}>
                            <strong>0{i + 1}</strong>
                            <h3>{item}</h3>
                            <p>
                                Configure a plataforma sem friccao e avance com
                                a sua equipa.
                            </p>
                        </article>
                    ))}
                </div>
            </section>
            <section id="pricing" className="landing-section">
                <span className="eyebrow">Precos</span>
                <h2>Planos simples e transparentes</h2>
                <div className="pricing-grid">
                    {prices.map((p, i) => (
                        <article
                            className={i === 1 ? "featured" : ""}
                            key={p[0]}
                        >
                            <h3>{p[0]}</h3>
                            <p>{p[2]}</p>
                            <strong>
                                {p[1]}
                                <small>/mes</small>
                            </strong>
                            <ul>
                                <li>Dashboards ilimitados</li>
                                <li>Alertas inteligentes</li>
                                <li>Suporte incluido</li>
                            </ul>
                            <button onClick={onRegister}>
                                {i === 2
                                    ? "Falar com vendas"
                                    : "Comecar gratis"}
                            </button>
                        </article>
                    ))}
                </div>
            </section>
            <section className="landing-section">
                <span className="eyebrow">Testemunhos</span>
                <h2>Empresas que crescem com a OnBoarding</h2>
                <div className="landing-grid three">
                    <article>
                        "Agora sabemos onde estamos antes da reuniao semanal."
                        <b>Ana Ribeiro</b>
                    </article>
                    <article>
                        "O assistente IA mudou a forma como olhamos para
                        metricas."<b>Miguel Costa</b>
                    </article>
                    <article>
                        "Ligamos os dados e no dia seguinte tinhamos
                        dashboards."<b>Sofia Almeida</b>
                    </article>
                </div>
            </section>
            <section id="faq" className="landing-section faq">
                <span className="eyebrow">FAQ</span>
                <h2>Perguntas frequentes</h2>
                {[
                    "Preciso de cartao de credito para comecar?",
                    "Os meus dados estao seguros?",
                    "Posso cancelar quando quiser?",
                    "Que integracoes estao disponiveis?",
                ].map((q) => (
                    <details key={q}>
                        <summary>{q}</summary>
                        <p>
                            Sim. A OnBoarding foi pensada para ser simples,
                            segura e flexivel.
                        </p>
                    </details>
                ))}
            </section>
            <section className="landing-cta">
                <h2>Pronto para decidir com dados?</h2>
                <p>
                    Junte-se a equipas que ja confiam na OnBoarding para
                    centralizar o seu negocio.
                </p>
                <button onClick={onRegister}>Criar conta</button>
                <button onClick={onLogin}>Conhecer planos</button>
            </section>
            <footer className="landing-footer">
                <span>2026 OnBoarding</span>
                <span>Privacidade | Termos | Contacto</span>
            </footer>
        </main>
    );
}
function AuthScreen({
    onAuth,
    mode: initialMode = "login",
    onModeChange,
    onBack,
}) {
    const [mode, setMode] = useState(initialMode);
    const changeMode = (next) => {
        setMode(next);
        onModeChange?.(next);
    };
    const [form, setForm] = useState({
        name: "",
        company_name: "",
        industry: "",
        employees_count: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const payload = { ...form };
            if (!payload.employees_count) delete payload.employees_count;
            const { data } = await api.post(
                mode === "login" ? "/login" : "/register",
                payload,
            );
            onAuth(data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Nao foi possivel autenticar.",
            );
        }
    };
    return (
        <main className="auth-shell auth-shell-pro">
            <section className="auth-visual">
                <div className="auth-copy">
                    <h1>
                        Configure a sua area de trabalho com dados reais desde o
                        primeiro acesso.
                    </h1>
                    <p>
                        Controle clientes, vendas, despesas, relatorios e equipa
                        num painel preparado para operacao diaria.
                    </p>
                    <div className="auth-benefits">
                        <span>
                            <Shield size={16} /> Conta privada por empresa
                        </span>
                        <span>
                            <Database size={16} /> Dados ligados a base de dados
                        </span>
                        <span>
                            <BarChart3 size={16} /> Indicadores em tempo real
                        </span>
                    </div>
                </div>
            </section>
            <section className="auth-panel">
                <form onSubmit={submit} className="auth-form auth-form-pro">
                    <button
                        type="button"
                        className="link back-link"
                        onClick={onBack}
                    >
                        Voltar
                    </button>
                    <div className="auth-card-head">
                        <span>
                            {mode === "login"
                                ? "Acesso seguro"
                                : "Nova area de trabalho"}
                        </span>
                        <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
                        <p>
                            {mode === "login"
                                ? "Entre com as credenciais da sua empresa."
                                : "Crie a conta admin e os dados iniciais da empresa."}
                        </p>
                    </div>
                    {mode === "register" && (
                        <>
                            <label>
                                Nome completo
                                <Input
                                    placeholder="Ex.: Ana Martins"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label>
                                Empresa
                                <Input
                                    placeholder="Nome da empresa"
                                    value={form.company_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            company_name: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <div className="auth-two-cols">
                                <label>
                                    Setor
                                    <Input
                                        placeholder="Ex.: Servicos"
                                        value={form.industry}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                industry: e.target.value,
                                            })
                                        }
                                    />
                                </label>
                                <label>
                                    Equipa
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ex.: 12"
                                        value={form.employees_count}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                employees_count: e.target.value,
                                            })
                                        }
                                    />
                                </label>
                            </div>
                        </>
                    )}
                    <label>
                        Email profissional
                        <Input
                            type="email"
                            placeholder="nome@empresa.com"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </label>
                    <label>
                        Password
                        <Input
                            type="password"
                            placeholder="Minimo 6 caracteres"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                        />
                    </label>
                    {error && <p className="alert error">{error}</p>}
                    <Button className="w-full auth-submit">
                        {mode === "login" ? "Entrar" : "Criar conta"}
                    </Button>
                    <button
                        type="button"
                        className="link auth-switch"
                        onClick={() =>
                            changeMode(mode === "login" ? "register" : "login")
                        }
                    >
                        {mode === "login"
                            ? "Criar nova conta"
                            : "Ja tenho conta"}
                    </button>
                    <p className="hint">
                        A conta fica associada a uma empresa e os dados ficam
                        isolados por utilizador.
                    </p>
                </form>
            </section>
        </main>
    );
}
function Sidebar({ page, setPage }) {
    const groups = [
        [
            "Resumo",
            [
                ["dashboard", "Dashboard", Grid3X3],
                ["analytics", "Analises", BarChart3],
                ["reports", "Relatorios", FileText],
            ],
        ],
        [
            "Negocio",
            [
                ["customers", "Clientes", Users],
                ["sales", "Vendas", ShoppingCart],
                ["products", "Produtos", Package],
                ["employees", "Funcionarios", BriefcaseBusiness],
            ],
        ],
        [
            "Dados",
            [
                ["imports", "Importacoes", Upload],
                ["exports", "Exportacoes", Download],
                ["integrations", "Integracoes", Plug],
            ],
        ],
        [
            "Ferramentas",
            [
                ["ai", "Assistente IA", Sparkles],
                ["notifications", "Notificacoes", Bell],
                ["settings", "Definicoes", Settings],
                ["profile", "Perfil", User],
            ],
        ],
    ];
    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-icon">
                    <Zap size={20} />
                </div>
                <div>
                    <strong>OnBoarding</strong>
                    <span>Inteligencia Empresarial</span>
                </div>
            </div>
            <nav>
                {groups.map(([label, items]) => (
                    <div className="nav-group" key={label}>
                        <p>{label}</p>
                        {items.map(([key, text, Icon]) => (
                            <button
                                key={key}
                                onClick={() => setPage(key)}
                                className={page === key ? "active" : ""}
                            >
                                <Icon size={18} />
                                <span>{text}</span>
                            </button>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="upgrade">
                <strong>Atualizar para Enterprise</strong>
                <span>Dashboards ilimitados e creditos de IA.</span>
                <button
                    type="button"
                    onClick={() => {
                        localStorage.setItem("if_settings_tab", "billing");
                        setPage("settings");
                    }}
                >
                    Ver planos
                </button>
            </div>
        </aside>
    );
}
function Navbar({
    user,
    onLogout,
    dark,
    setDark,
    badge,
    onSearch,
    onNavigate,
}) {
    const [term, setTerm] = useState("");
    const submit = (e) => {
        e.preventDefault();
        onSearch(term);
    };
    return (
        <header className="navbar">
            <form className="search-box" onSubmit={submit}>
                <Search size={18} />
                <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Pesquisar clientes, relatorios, produtos..."
                />
                <button type="submit">
                    <Command size={12} /> K
                </button>
            </form>
            <div className="nav-actions">
                <button className="icon-btn" onClick={() => setDark(!dark)}>
                    {dark ? <Sun /> : <Moon />}
                </button>
                <button
                    className="icon-btn"
                    onClick={() => onNavigate("notifications")}
                    title="Abrir notificacoes"
                >
                    <Bell />
                    <i></i>
                    {badge > 0 && <em>{badge}</em>}
                </button>
                <div className="user-block">
                    <div className="avatar">
                        {(user?.name || "U")
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                    <div>
                        <strong>{user?.name}</strong>
                        <span>
                            {user?.role === "admin"
                                ? "Administrador da empresa"
                                : user?.role}
                        </span>
                    </div>
                </div>
                <button className="logout" onClick={onLogout}>
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}
function Layout({ user, logout }) {
    const [page, setPage] = useState("dashboard");
    const [dark, setDark] = useState(
        localStorage.getItem("if_theme") === "dark",
    );
    const [badge, setBadge] = useState(0);
    const [globalSearch, setGlobalSearch] = useState("");
    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("if_theme", dark ? "dark" : "light");
    }, [dark]);
    const navigate = (target) => {
        setGlobalSearch("");
        setPage(target);
    };
    const handleSearch = (raw) => {
        const term = raw.trim();
        if (!term) return;
        const q = term.toLowerCase();
        const target = q.includes("produto")
            ? "products"
            : q.includes("venda") || q.includes("fatura")
              ? "sales"
              : q.includes("despesa")
                ? "expenses"
                : q.includes("funcionario") || q.includes("colaborador")
                  ? "employees"
                  : q.includes("relatorio")
                    ? "reports"
                    : q.includes("analise") || q.includes("grafico")
                      ? "analytics"
                      : q.includes("import")
                        ? "imports"
                        : q.includes("export")
                          ? "exports"
                          : q.includes("integr")
                            ? "integrations"
                            : q.includes("notific")
                              ? "notifications"
                              : q.includes("definic") || q.includes("perfil")
                                ? "settings"
                                : "customers";
        setGlobalSearch(
            [
                "customers",
                "products",
                "sales",
                "expenses",
                "employees",
            ].includes(target)
                ? term
                : "",
        );
        setPage(target);
    };
    return (
        <div className="app-shell">
            <Sidebar page={page} setPage={navigate} />
            <main>
                <Navbar
                    user={user}
                    onLogout={logout}
                    dark={dark}
                    setDark={setDark}
                    badge={badge}
                    onSearch={handleSearch}
                    onNavigate={navigate}
                />
                <div className="content">
                    <Page
                        page={page}
                        setBadge={setBadge}
                        setPage={navigate}
                        globalSearch={globalSearch}
                    />
                </div>
            </main>
        </div>
    );
}
function Page({ page, setBadge, setPage, globalSearch }) {
    if (page === "dashboard")
        return <Dashboard setBadge={setBadge} setPage={setPage} />;
    if (page === "analytics") return <Analytics />;
    if (page === "reports") return <Reports />;
    if (page === "sales") return <SalesPage />;
    if (page === "imports") return <Imports />;
    if (page === "exports") return <Exports />;
    if (page === "integrations") return <Integrations />;
    if (page === "notifications") return <Notifications setBadge={setBadge} />;
    if (page === "ai") return <AIInsights />;
    if (page === "settings" || page === "profile") return <SettingsPage />;
    return <Crud resource={page} initialSearch={globalSearch} />;
}
function Dashboard({ setBadge, setPage }) {
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({
        period: "year",
        category: "",
        region: "Todas as regioes",
    });
    const params = useMemo(() => {
        const now = new Date();
        const iso = (d) => d.toISOString().slice(0, 10);
        const p = {};
        if (filters.period === "today") {
            p.from = iso(now);
            p.to = iso(now);
        }
        if (filters.period === "month") {
            p.month = now.getMonth() + 1;
            p.year = now.getFullYear();
        }
        if (filters.period === "quarter") {
            const startMonth = Math.floor(now.getMonth() / 3) * 3;
            const start = new Date(now.getFullYear(), startMonth, 1);
            p.from = iso(start);
            p.to = iso(now);
        }
        if (filters.period === "year") {
            p.year = now.getFullYear();
        }
        if (filters.category) p.category = filters.category;
        return p;
    }, [filters]);
    useEffect(() => {
        api.get("/dashboard", { params }).then((r) => {
            setData(r.data);
            setBadge(r.data.unread_notifications);
        });
    }, [params]);
    if (!data) return <LoadingSkeleton />;
    const monthly = data.sales_by_month || [];
    const categoryChart = data.sales_by_category || [];
    const exportSales = () =>
        api.get("/exports/sales", { responseType: "blob" }).then((r) => {
            const url = URL.createObjectURL(r.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = "dashboard-vendas.csv";
            a.click();
            URL.revokeObjectURL(url);
        });
    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Bem-vindo de volta - veja o que esta a acontecer no seu negocio hoje."
                actions={
                    <>
                        <Button variant="ghost" onClick={exportSales}>
                            <Download size={16} /> Exportar
                        </Button>
                        <Button onClick={() => setPage("reports")}>
                            <Plus size={16} /> Novo relatorio
                        </Button>
                    </>
                }
            />
            <DashboardFilters
                filters={filters}
                setFilters={setFilters}
                categories={data.categories || []}
                onReset={() => {
                    setData(null);
                    setFilters({
                        period: "year",
                        category: "",
                        region: "Todas as regioes",
                    });
                }}
            />
            <div className="metric-grid">
                <StatCard
                    label="Receita total"
                    value={money(data.total_revenue)}
                    delta="+12.4%"
                />
                <StatCard
                    label="Receita mensal"
                    value={money(data.monthly_revenue)}
                    delta="+8.2%"
                />
                <StatCard
                    label="Lucro"
                    value={money(data.estimated_profit)}
                    delta="+15.1%"
                />
                <StatCard
                    label="Despesas"
                    value={money(data.total_expenses)}
                    delta="-3.4%"
                    tone="down"
                />
                <StatCard
                    label="Clientes ativos"
                    value={data.active_customers?.toLocaleString()}
                    delta="+4.7%"
                />
                <StatCard
                    label="Novos clientes"
                    value={data.new_customers?.toLocaleString()}
                    delta={`${Number(data.new_customers_growth || 0).toFixed(1)}%`}
                />
                <StatCard
                    label="Crescimento das vendas"
                    value={`${Number(data.monthly_growth || 0).toFixed(1)}%`}
                    delta="+2.1%"
                />
                <StatCard
                    label="Encomendas"
                    value={data.total_sales?.toLocaleString()}
                    delta="+9.8%"
                />
                <StatCard
                    label="Taxa de conversao"
                    value={`${Number(data.conversion_rate || 0).toFixed(1)}%`}
                    delta="-0.2%"
                    tone="down"
                />
            </div>
            <div className="dashboard-grid">
                <ChartCard
                    title="Receita ao longo do tempo"
                    subtitle="Receita mensal e despesas"
                    className="wide"
                    tag={String(new Date().getFullYear())}
                >
                    <ResponsiveContainer>
                        <AreaChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis
                                tickFormatter={(v) =>
                                    `${Math.round(v / 1000)}k`
                                }
                            />
                            <Tooltip formatter={money} />
                            <Area
                                dataKey="revenue"
                                stroke="#7657ff"
                                fill="#dcd3ff"
                                strokeWidth={3}
                                animationDuration={900}
                            />
                            <Area
                                dataKey="expenses"
                                stroke="#1e90ff"
                                fill="#d9ecff"
                                strokeWidth={3}
                                animationDuration={900}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard
                    title="Vendas por regiao"
                    subtitle="Distribuicao por mercados"
                >
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={categoryChart}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={70}
                                outerRadius={105}
                                paddingAngle={2}
                                animationDuration={900}
                            >
                                {categoryChart.map((_, i) => (
                                    <Cell key={i} fill={colors[i]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="legend-row">
                        {categoryChart.map((r, i) => (
                            <span key={r.name}>
                                <b style={{ background: colors[i] }}></b>
                                {r.name}
                            </span>
                        ))}
                    </div>
                </ChartCard>
                <ChartCard title="Vendas por mes" subtitle="Totais em barras">
                    <ResponsiveContainer>
                        <BarChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis
                                tickFormatter={(v) =>
                                    `${Math.round(v / 1000)}k`
                                }
                            />
                            <Tooltip formatter={money} />
                            <Bar
                                dataKey="revenue"
                                fill="#7657ff"
                                radius={[8, 8, 0, 0]}
                                animationDuration={900}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard
                    title="Crescimento de clientes"
                    subtitle="Clientes ativos por mes"
                >
                    <ResponsiveContainer>
                        <LineChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                dataKey="customers"
                                stroke="#1e90ff"
                                strokeWidth={3}
                                animationDuration={900}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <TopProducts products={data.top_products} />
                <ActivityCards
                    sales={data.recent_sales || []}
                    notifications={data.recent_notifications || []}
                />
            </div>
        </>
    );
}
function TopProducts({ products = [] }) {
    const list = products.filter((p) => Number(p.sales || p.revenue || 0) > 0);
    if (!list.length) {
        return (
            <section className="card top-products empty-state">
                <h3>Produtos mais vendidos</h3>
                <p>Sem vendas registadas para o periodo selecionado.</p>
            </section>
        );
    }
    const max = Math.max(...list.map((p) => p.sales || p.revenue || 1));
    return (
        <section className="card top-products">
            <h3>Produtos mais vendidos</h3>
            <p>Unidades vendidas neste periodo</p>
            {list.slice(0, 5).map((p, i) => {
                const val = p.sales || Math.round((p.revenue || 0) / 100);
                return (
                    <div className="progress-row" key={p.name}>
                        <div>
                            <span>{p.name}</span>
                            <em>{val}</em>
                        </div>
                        <i>
                            <b
                                style={{
                                    width: `${Math.max(18, (val / max) * 100)}%`,
                                    background: `linear-gradient(90deg, ${colors[i % colors.length]}, #0ea5e9)`,
                                }}
                            ></b>
                        </i>
                    </div>
                );
            })}
        </section>
    );
}
function ActivityCards({ sales = [], notifications = [] }) {
    return (
        <>
            <section className="card feed-card">
                <h3>Atividades recentes</h3>
                {sales.length ? (
                    sales.map((sale) => (
                        <div className="feed-row" key={sale.id}>
                            <span>
                                {(sale.customer || "VD")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </span>
                            <div>
                                <strong>Venda registada</strong>
                                <p>
                                    {sale.customer || "Cliente direto"} -{" "}
                                    {money(sale.total)}
                                </p>
                            </div>
                            <small>{sale.date}</small>
                        </div>
                    ))
                ) : (
                    <p className="muted-empty">Sem atividades recentes.</p>
                )}
            </section>
            <section className="card order-card">
                <h3>Vendas recentes</h3>
                {sales.length ? (
                    sales.map((sale) => (
                        <div className="order-row" key={sale.id}>
                            <div>
                                <strong>
                                    {sale.customer || "Cliente direto"}
                                </strong>
                                <p>{sale.product || "Sem produto associado"}</p>
                            </div>
                            <span>
                                {money(sale.total)}
                                <em
                                    className={(
                                        sale.status || "paid"
                                    ).toLowerCase()}
                                >
                                    {sale.status || "Pago"}
                                </em>
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="muted-empty">Ainda nao existem vendas.</p>
                )}
            </section>
            <section className="card task-card">
                <h3>Notificacoes recentes</h3>
                {notifications.length ? (
                    notifications.map((n, i) => (
                        <p className="mini-note" key={n.id || n.title}>
                            <b className={`dot d${i % 4}`}></b>
                            {n.title}
                            <small>{n.message}</small>
                        </p>
                    ))
                ) : (
                    <p className="muted-empty">Sem notificacoes ativas.</p>
                )}
            </section>
        </>
    );
}
function TopLists({ data }) {
    return (
        <div className="list-grid">
            <TopProducts products={data.top_products} />
            <section className="card">
                <h3>Top clientes</h3>
                {data.top_customers?.map((p, i) => (
                    <div className="row" key={p.name}>
                        <span>
                            {i + 1}. {p.name}
                        </span>
                        <strong>{money(p.revenue)}</strong>
                    </div>
                ))}
            </section>
        </div>
    );
}
function Analytics() {
    const [filters, setFilters] = useState({});
    const [data, setData] = useState(null);
    const load = () =>
        api
            .get("/analytics", {
                params: Object.fromEntries(
                    Object.entries(filters).filter(([, v]) => v),
                ),
            })
            .then((r) => setData(r.data));
    useEffect(() => {
        load();
    }, []);
    const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ];
    return (
        <>
            <div className="page-title">
                <div>
                    <h1>Analises</h1>
                    <p>
                        Graficos avancados com filtros por data, mes, ano e
                        categoria.
                    </p>
                </div>
                <div className="filters filters-wrap">
                    <Input
                        type="date"
                        value={filters.from || ""}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                from: e.target.value,
                                month: "",
                            })
                        }
                    />
                    <Input
                        type="date"
                        value={filters.to || ""}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                to: e.target.value,
                                month: "",
                            })
                        }
                    />
                    <select
                        className="input"
                        value={filters.month || ""}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                month: e.target.value,
                                from: "",
                                to: "",
                            })
                        }
                    >
                        <option value="">Mes</option>
                        {months.map((m, i) => (
                            <option key={m} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={filters.year || ""}
                        onChange={(e) =>
                            setFilters({ ...filters, year: e.target.value })
                        }
                    >
                        <option value="">Ano</option>
                        {(data?.years?.length
                            ? data.years
                            : [new Date().getFullYear()]
                        ).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={filters.category || ""}
                        onChange={(e) =>
                            setFilters({ ...filters, category: e.target.value })
                        }
                    >
                        <option value="">Categoria</option>
                        {(data?.categories || []).map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <Button onClick={load}>Filtrar</Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setFilters({});
                            api.get("/analytics").then((r) => setData(r.data));
                        }}
                    >
                        Limpar
                    </Button>
                </div>
            </div>
            {!data ? (
                <LoadingSkeleton />
            ) : (
                <>
                    <div className="stats-grid">
                        <StatCard
                            icon={Activity}
                            label="Receita filtrada"
                            value={money(data.total_revenue)}
                            hint={`${data.total_sales} vendas`}
                        />
                        <StatCard
                            icon={WalletCards}
                            label="Despesas filtradas"
                            value={money(data.total_expenses)}
                            hint="Periodo atual"
                        />
                        <StatCard
                            icon={BarChart3}
                            label="Lucro filtrado"
                            value={money(data.estimated_profit)}
                            hint="Receita menos despesas"
                        />
                        <StatCard
                            icon={Users}
                            label="Clientes ativos"
                            value={data.active_customers}
                            hint="Base da empresa"
                        />
                    </div>
                    <div className="charts-grid">
                        <ChartCard title="Receita por mes">
                            <ResponsiveContainer>
                                <AreaChart data={data.sales_by_month}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={money} />
                                    <Area
                                        dataKey="revenue"
                                        stroke="#2563eb"
                                        fill="#bfdbfe"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Despesas vs Receita">
                            <ResponsiveContainer>
                                <BarChart data={data.revenue_vs_expenses}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={money} />
                                    <Bar dataKey="revenue" fill="#14b8a6" />
                                    <Bar dataKey="expenses" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Vendas por categoria">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={data.sales_by_category}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={95}
                                        label
                                    >
                                        {data.sales_by_category.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={colors[i % colors.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={money} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Crescimento de clientes">
                            <ResponsiveContainer>
                                <BarChart data={data.customers_by_month}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="customers" fill="#8b5cf6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Produtos mais vendidos">
                            <ResponsiveContainer>
                                <BarChart data={data.top_products}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="sales" fill="#14b8a6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Evolucao do lucro">
                            <ResponsiveContainer>
                                <LineChart data={data.sales_by_month}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={money} />
                                    <Line
                                        dataKey="profit"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                    <TopLists data={data} />
                </>
            )}
        </>
    );
}

function Crud({ resource, initialSearch = "" }) {
    const cfg = resources[resource];
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({});
    const [search, setSearch] = useState(initialSearch);
    const [form, setForm] = useState(null);
    const [msg, setMsg] = useState("");
    const load = (term = search) =>
        api.get(`/${resource}`, { params: { search: term } }).then((r) => {
            setRows(r.data.data);
            setMeta(r.data);
        });
    useEffect(() => {
        const term = initialSearch || "";
        setSearch(term);
        load(term);
    }, [resource, initialSearch]);
    const save = async (e) => {
        e.preventDefault();
        const id = form.id;
        const payload = { ...form };
        delete payload.id;
        try {
            id
                ? await api.put(`/${resource}/${id}`, payload)
                : await api.post(`/${resource}`, payload);
            setMsg("Guardado com sucesso.");
            setForm(null);
            load();
        } catch (err) {
            setMsg(err.response?.data?.message || "Erro ao guardar.");
        }
    };
    const remove = async (id) => {
        await api.delete(`/${resource}/${id}`);
        load();
    };
    return (
        <>
            <div className="page-title">
                <div>
                    <h1>{cfg.label}</h1>
                    <p>
                        Gestao completa com pesquisa, criacao, edicao e
                        eliminacao.
                    </p>
                </div>
                <Button onClick={() => setForm({})}>
                    <Plus size={16} /> Novo
                </Button>
            </div>
            <div className="toolbar">
                <Search size={18} />
                <Input
                    placeholder="Pesquisar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load()}
                />
                <Button variant="ghost" onClick={() => load()}>
                    Pesquisar
                </Button>
            </div>
            {msg && <p className="alert">{msg}</p>}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            {cfg.fields.map((f) => (
                                <th key={f}>{f}</th>
                            ))}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {cfg.fields.map((f) => (
                                    <td key={f}>{display(row, f)}</td>
                                ))}
                                <td>
                                    <button onClick={() => setForm(row)}>
                                        Editar
                                    </button>
                                    <button onClick={() => remove(row.id)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!rows.length && (
                    <div className="empty">Sem registos para mostrar.</div>
                )}
            </div>
            {form && (
                <Modal
                    title={`${form.id ? "Editar" : "Novo"} ${cfg.label}`}
                    onClose={() => setForm(null)}
                >
                    <form onSubmit={save} className="form-grid">
                        {cfg.fields.map((f) => (
                            <Input
                                key={f}
                                type={
                                    f.includes("date")
                                        ? "date"
                                        : [
                                                "price",
                                                "stock",
                                                "total",
                                                "amount",
                                                "quantity",
                                                "customer_id",
                                                "product_id",
                                            ].includes(f)
                                          ? "number"
                                          : "text"
                                }
                                placeholder={f}
                                value={form[f] ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, [f]: e.target.value })
                                }
                            />
                        ))}
                        <Button>Guardar</Button>
                    </form>
                </Modal>
            )}
        </>
    );
}
function display(row, f) {
    if (f === "customer_id") return row.customer?.name || row[f];
    if (f === "product_id") return row.product?.name || row[f];
    if (["price", "total", "amount"].includes(f)) return money(row[f]);
    return row[f];
}
function Modal({ title, children, onClose }) {
    return (
        <div className="modal-backdrop">
            <div className="modal">
                <button className="close" onClick={onClose}>
                    <X />
                </button>
                <h2>{title}</h2>
                {children}
            </div>
        </div>
    );
}

function SalesPage() {
    const [rows, setRows] = useState([]);
    const [data, setData] = useState(null);
    useEffect(() => {
        api.get("/sales").then((r) => setRows(r.data.data));
        api.get("/dashboard").then((r) => setData(r.data));
    }, []);
    const chart = data?.sales_by_month || [];
    return (
        <>
            <PageHeader
                title="Vendas"
                subtitle="Negocios, faturas e saude do pipeline."
            />
            <FilterBar />
            <div className="metric-grid sales-metrics">
                <StatCard
                    label="Pipeline"
                    value={money((data?.total_revenue || 0) * 1.14)}
                    delta="+12%"
                />
                <StatCard
                    label="Fechados ganhos"
                    value={money(data?.monthly_revenue)}
                    delta="+8%"
                />
                <StatCard label="Taxa de sucesso" value="34.2%" delta="+2.1%" />
                <StatCard
                    label="Valor medio do negocio"
                    value={money(data?.avg_deal_size)}
                    delta="-1.2%"
                    tone="down"
                />
            </div>
            <ChartCard title="Trajetoria de vendas" className="full-chart">
                <ResponsiveContainer>
                    <AreaChart data={chart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                            tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                        />
                        <Tooltip formatter={money} />
                        <Area
                            dataKey="revenue"
                            stroke="#7657ff"
                            fill="#ded7ff"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
            <div className="table-card invoice-table">
                <table>
                    <thead>
                        <tr>
                            <th>Fatura</th>
                            <th>Cliente</th>
                            <th>Valor</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, 5).map((row, i) => (
                            <tr key={row.id}>
                                <td>#INV-1042{8 - i}</td>
                                <td>
                                    {row.customer?.name || "Cliente direto"}
                                </td>
                                <td>{money(row.total)}</td>
                                <td>
                                    <span
                                        className={`status ${(row.status || "paid").toLowerCase()}`}
                                    >
                                        {row.status || "Pago"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function Integrations() {
    const cards = [
        ["MySQL", "Sincronize dados da sua base MySQL.", Database, true],
        [
            "PostgreSQL",
            "Sincronizacao em tempo real com Postgres.",
            Database,
            true,
        ],
        ["SQL Server", "Ligar ao Microsoft SQL Server.", Database, false],
        ["Excel", "Importe livros Excel.", FileSpreadsheet, true],
        [
            "Google Sheets",
            "Sincronizacao bidirecional com Sheets.",
            Grid3X3,
            false,
        ],
        ["REST API", "Obtenha dados de qualquer endpoint REST.", Plug, false],
    ];
    return (
        <>
            <PageHeader
                title="Integracoes"
                subtitle="Ligue as suas fontes de dados ao OnBoarding."
            />
            <div className="integration-grid">
                {cards.map(([name, desc, Icon, connected]) => (
                    <section className="card integration-card" key={name}>
                        <span className={`conn ${connected ? "yes" : "no"}`}>
                            {connected ? "Ligado" : "Nao ligado"}
                        </span>
                        <div className="soft-icon">
                            <Icon size={24} />
                        </div>
                        <h2>{name}</h2>
                        <p>{desc}</p>
                        <Button variant={connected ? "ghost" : "primary"}>
                            {connected ? "Gerir" : "Ligar"}
                        </Button>
                    </section>
                ))}
            </div>
            <section className="card custom-integration">
                <div className="brand-icon">
                    <Plug size={22} />
                </div>
                <div>
                    <h2>Precisa de uma integracao personalizada?</h2>
                    <p>
                        A nossa equipa pode criar conectores para qualquer
                        sistema interno.
                    </p>
                </div>
                <Button variant="ghost">Contacte-nos</Button>
            </section>
        </>
    );
}
function Reports() {
    const [data, setData] = useState(null);
    useEffect(() => {
        api.get("/reports/summary").then((r) => setData(r.data));
    }, []);
    if (!data) return <LoadingSkeleton />;
    return (
        <>
            <div className="page-title">
                <div>
                    <h1>Relatorios</h1>
                    <p>Resumo financeiro e relatorio imprimivel.</p>
                </div>
                <Button onClick={() => window.print()}>
                    <FileText size={16} /> Imprimir
                </Button>
            </div>
            <div className="stats-grid">
                <StatCard
                    icon={Activity}
                    label="Receita"
                    value={money(data.total_revenue)}
                    hint="Periodo selecionado"
                />
                <StatCard
                    icon={WalletCards}
                    label="Despesas"
                    value={money(data.total_expenses)}
                    hint="Total"
                />
                <StatCard
                    icon={BarChart3}
                    label="Lucro"
                    value={money(data.estimated_profit)}
                    hint="Estimado"
                />
                <StatCard
                    icon={Users}
                    label="Clientes ativos"
                    value={data.active_customers}
                    hint="Base atual"
                />
            </div>
            <TopLists data={data} />
            <div className="card">
                <h3>Historico de relatorios</h3>
                {data.history.map((h) => (
                    <div className="row" key={h.name}>
                        <span>{h.name}</span>
                        <small>{h.created_at}</small>
                    </div>
                ))}
            </div>
        </>
    );
}
function Imports() {
    const [type, setType] = useState("customers");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [msg, setMsg] = useState("");
    const handleFile = (selected) => {
        setFile(selected);
        setPreview([]);
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = () => {
            const lines = String(reader.result || "")
                .split(/\r?\n/)
                .filter(Boolean)
                .slice(0, 6)
                .map((line) => line.split(","));
            setPreview(lines);
        };
        reader.readAsText(selected);
    };
    const submit = async (e) => {
        e.preventDefault();
        if (!file) {
            setMsg("Escolhe um ficheiro CSV antes de importar.");
            return;
        }
        const fd = new FormData();
        fd.append("type", type);
        fd.append("file", file);
        const { data } = await api.post("/imports", fd);
        setMsg(
            `${data.created} registos importados. A notificacao de importacao concluida foi criada.`,
        );
        setPreview([]);
        setFile(null);
    };
    return (
        <section className="card narrow">
            <h1>Importacoes</h1>
            <form onSubmit={submit} className="form-grid">
                <select
                    className="input"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    {["customers", "products", "sales", "expenses"].map((t) => (
                        <option key={t}>{t}</option>
                    ))}
                </select>
                <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                {preview.length > 0 && (
                    <div className="preview-box">
                        <strong>Preview</strong>
                        <table>
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={i}>
                                        {row.map((cell, j) => (
                                            <td key={j}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Button>
                    <Upload size={16} /> Importar CSV
                </Button>
            </form>
            {msg && <p className="alert">{msg}</p>}
        </section>
    );
}
function Exports() {
    const cards = [
        [
            "CSV",
            "Valores separados por virgulas, ideal para folhas de calculo.",
            FileSpreadsheet,
            "Exportar como CSV",
            "customers",
        ],
        [
            "Excel",
            "XLSX nativo com formatacao preservada.",
            FileDown,
            "Exportar como Excel",
            "products",
        ],
        [
            "PDF",
            "Relatorio pronto para apresentacao com graficos e marca.",
            FileText,
            "Exportar como PDF",
            "print",
        ],
    ];
    const download = (type) => {
        if (type === "print") {
            window.print();
            return;
        }
        api.get(`/exports/${type}`, { responseType: "blob" }).then((r) => {
            const url = URL.createObjectURL(r.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${type}.csv`;
            a.click();
        });
    };
    return (
        <>
            <PageHeader
                title="Exportar dados"
                subtitle="Descarregue os seus dados no formato pretendido."
            />
            <div className="export-grid">
                {cards.map(([title, desc, Icon, btn, type]) => (
                    <section className="card export-card" key={title}>
                        <div className="soft-icon">
                            <Icon size={25} />
                        </div>
                        <h2>{title}</h2>
                        <p>{desc}</p>
                        <Button onClick={() => download(type)}>{btn}</Button>
                    </section>
                ))}
            </div>
        </>
    );
}
function Notifications({ setBadge }) {
    const [rows, setRows] = useState([]);
    const load = () =>
        api.get("/notifications").then((r) => {
            setRows(r.data);
            setBadge(r.data.filter((n) => !n.is_read).length);
        });
    useEffect(() => {
        load();
    }, []);
    const read = async (id) => {
        await api.patch(`/notifications/${id}/read`);
        load();
    };
    return (
        <>
            <div className="page-title">
                <h1>Notificacoes</h1>
            </div>
            <div className="list-grid one">
                {rows.map((n) => (
                    <div
                        className={`card notification ${n.is_read ? "read" : ""}`}
                        key={n.id}
                    >
                        <span>{n.type}</span>
                        <h3>{n.title}</h3>
                        <p>{n.message}</p>
                        {!n.is_read && (
                            <Button variant="ghost" onClick={() => read(n.id)}>
                                Marcar como lida
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
function AIInsights() {
    const qs = [
        "Porque e que as vendas estao a descer?",
        "Qual foi o meu melhor mes?",
        "Que produto gerou mais receita?",
        "Resume o desempenho deste mes.",
    ];
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Ola! Sou o assistente OnBoarding. Pergunte-me qualquer coisa sobre os seus dados.",
        },
    ]);
    const [input, setInput] = useState("");
    const ask = async (q) => {
        if (!q) return;
        setMessages((m) => [...m, { role: "user", text: q }]);
        setInput("");
        const { data } = await api.post("/ai-insights", { question: q });
        setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    };
    return (
        <>
            <PageHeader
                title="Assistente IA"
                subtitle="Converse com os dados do negocio em linguagem simples."
            />
            <section className="ai-shell">
                <div className="chat-area">
                    {messages.map((m, i) => (
                        <div className={`bubble ${m.role}`} key={i}>
                            {m.role === "assistant" && (
                                <span>
                                    <Sparkles size={18} />
                                </span>
                            )}
                            <p>{m.text}</p>
                        </div>
                    ))}
                    <div className="try-box">
                        <span>EXPERIMENTE PERGUNTAR</span>
                        <div>
                            {qs.map((q) => (
                                <button key={q} onClick={() => ask(q)}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="ai-input">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && ask(input)}
                        placeholder="Pergunte sobre receita, clientes, produtos..."
                    />
                    <button onClick={() => ask(input)}>
                        <Send size={18} />
                    </button>
                </div>
            </section>
        </>
    );
}
function SettingsPage() {
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState({});
    const [company, setCompany] = useState({});
    const [language, setLanguage] = useState(
        localStorage.getItem("if_language") || "pt",
    );
    const [security, setSecurity] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [tab, setTab] = useState(
        localStorage.getItem("if_settings_tab") || "company",
    );
    const [msg, setMsg] = useState("");
    const [prefs, setPrefs] = useState({
        email: true,
        alerts: true,
        weekly: false,
    });
    const load = () =>
        api.get("/settings").then((r) => {
            setData(r.data);
            setProfile({ name: r.data.user.name, email: r.data.user.email });
            setCompany({ ...r.data.user.company });
        });
    useEffect(() => {
        load();
    }, []);
    useEffect(() => {
        localStorage.setItem("if_language", language);
    }, [language]);
    if (!data) return <LoadingSkeleton />;
    const isAdmin = data.user.role === "admin";
    const saveProfile = async (e) => {
        e.preventDefault();
        const { data: user } = await api.put("/settings/profile", profile);
        setData((d) => ({ ...d, user: { ...user, company: d.user.company } }));
        setMsg("Perfil atualizado.");
    };
    const saveCompany = async (e) => {
        e.preventDefault();
        const { data: companyData } = await api.put(
            "/settings/company",
            company,
        );
        setData((d) => ({ ...d, user: { ...d.user, company: companyData } }));
        setMsg("Dados da empresa atualizados.");
    };
    const saveRole = async (member, role) => {
        const { data: updated } = await api.patch(
            `/settings/members/${member.id}/role`,
            { role },
        );
        setData((d) => ({
            ...d,
            members: d.members.map((m) => (m.id === updated.id ? updated : m)),
        }));
        setMsg("Permissao atualizada.");
    };
    const saveSecurity = async (e) => {
        e.preventDefault();
        const { data: res } = await api.put("/settings/security", security);
        setSecurity({
            current_password: "",
            password: "",
            password_confirmation: "",
        });
        setMsg(res.message);
    };
    const tabs = [
        ["company", Building2, "Empresa"],
        ["team", Users, "Equipa"],
        ["permissions", Shield, "Permissoes"],
        ["billing", WalletCards, "Faturacao"],
        ["api", Plug, "API Keys"],
        ["integrations", Database, "Integracoes"],
        ["security", Settings, "Seguranca"],
        ["notifications", Bell, "Notificacoes"],
    ];
    return (
        <>
            <div className="page-title">
                <div>
                    <h1>Definicoes</h1>
                    <p>Gerir empresa, equipa e area de trabalho.</p>
                </div>
            </div>
            {msg && <p className="alert">{msg}</p>}
            <div className="settings-tabs">
                {tabs.map(([key, Icon, label]) => (
                    <button
                        key={key}
                        onClick={() => {
                            setTab(key);
                            localStorage.setItem("if_settings_tab", key);
                        }}
                        className={tab === key ? "active" : ""}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>
            {tab === "company" && (
                <form className="settings-panel" onSubmit={saveCompany}>
                    <h3>Perfil da empresa</h3>
                    <div className="company-logo-row">
                        <div className="company-logo">
                            {(company.logo || company.name || "IF")
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <label className="btn btn-ghost upload-logo">
                            Upload logo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () =>
                                        setCompany({
                                            ...company,
                                            logo: String(reader.result),
                                        });
                                    reader.readAsDataURL(file);
                                }}
                            />
                        </label>
                    </div>
                    <div className="settings-form-grid">
                        <label>
                            Nome da empresa
                            <Input
                                value={company.name || ""}
                                onChange={(e) =>
                                    setCompany({
                                        ...company,
                                        name: e.target.value,
                                    })
                                }
                                disabled={!isAdmin}
                            />
                        </label>
                        <label>
                            Industria
                            <Input
                                value={company.industry || ""}
                                onChange={(e) =>
                                    setCompany({
                                        ...company,
                                        industry: e.target.value,
                                    })
                                }
                                disabled={!isAdmin}
                            />
                        </label>
                        <label>
                            Colaboradores
                            <Input
                                type="number"
                                value={company.employees_count || ""}
                                onChange={(e) =>
                                    setCompany({
                                        ...company,
                                        employees_count: e.target.value,
                                    })
                                }
                                disabled={!isAdmin}
                            />
                        </label>
                        <label>
                            Plano
                            <Input
                                value={company.plan || ""}
                                onChange={(e) =>
                                    setCompany({
                                        ...company,
                                        plan: e.target.value,
                                    })
                                }
                                disabled={!isAdmin}
                            />
                        </label>
                        <label>
                            Idioma
                            <select
                                className="input"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="pt">Portugues</option>
                                <option value="en">English</option>
                            </select>
                        </label>
                        <label>
                            Logo
                            <Input
                                value={company.logo || ""}
                                onChange={(e) =>
                                    setCompany({
                                        ...company,
                                        logo: e.target.value,
                                    })
                                }
                                disabled={!isAdmin}
                            />
                        </label>
                    </div>
                    <Button disabled={!isAdmin}>Guardar alteracoes</Button>
                    {!isAdmin && (
                        <small>
                            Apenas admin pode editar os dados da empresa.
                        </small>
                    )}
                </form>
            )}
            {tab === "team" && (
                <div className="settings-panel">
                    <form onSubmit={saveProfile} className="settings-subform">
                        <h3>Perfil do utilizador</h3>
                        <div className="settings-form-grid">
                            <label>
                                Nome
                                <Input
                                    value={profile.name || ""}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label>
                                Email
                                <Input
                                    type="email"
                                    value={profile.email || ""}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>
                        <Button>Guardar perfil</Button>
                    </form>
                    <h3>Membros da equipa</h3>
                    {data.members.map((m) => (
                        <div className="team-row" key={m.id}>
                            <div>
                                <strong>{m.name}</strong>
                                <span>{m.email}</span>
                            </div>
                            {isAdmin ? (
                                <select
                                    className="input compact"
                                    value={m.role}
                                    onChange={(e) =>
                                        saveRole(m, e.target.value)
                                    }
                                >
                                    <option value="admin">admin</option>
                                    <option value="manager">manager</option>
                                    <option value="employee">employee</option>
                                </select>
                            ) : (
                                <strong>{m.role}</strong>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {tab === "permissions" && (
                <div className="settings-panel">
                    <h3>Permissoes</h3>
                    <p>
                        <strong>admin</strong> gere tudo.
                    </p>
                    <p>
                        <strong>manager</strong> consulta dashboards, relatorios
                        e dados.
                    </p>
                    <p>
                        <strong>employee</strong> consulta dados limitados sem
                        criar, editar ou eliminar.
                    </p>
                </div>
            )}
            {tab === "security" && (
                <form
                    className="settings-panel settings-subform"
                    onSubmit={saveSecurity}
                >
                    <h3>Seguranca</h3>
                    <Input
                        type="password"
                        placeholder="Password atual"
                        value={security.current_password}
                        onChange={(e) =>
                            setSecurity({
                                ...security,
                                current_password: e.target.value,
                            })
                        }
                    />
                    <Input
                        type="password"
                        placeholder="Nova password"
                        value={security.password}
                        onChange={(e) =>
                            setSecurity({
                                ...security,
                                password: e.target.value,
                            })
                        }
                    />
                    <Input
                        type="password"
                        placeholder="Confirmar nova password"
                        value={security.password_confirmation}
                        onChange={(e) =>
                            setSecurity({
                                ...security,
                                password_confirmation: e.target.value,
                            })
                        }
                    />
                    <Button>Atualizar password</Button>
                </form>
            )}
            {tab === "notifications" && (
                <div className="settings-panel">
                    <h3>Notificacoes</h3>
                    {Object.entries({
                        email: "Notificacoes por email",
                        alerts: "Alertas criticos",
                        weekly: "Resumo semanal",
                    }).map(([key, label]) => (
                        <label className="toggle-row" key={key}>
                            {label}
                            <input
                                type="checkbox"
                                checked={prefs[key]}
                                onChange={(e) =>
                                    setPrefs({
                                        ...prefs,
                                        [key]: e.target.checked,
                                    })
                                }
                            />
                        </label>
                    ))}
                </div>
            )}
            {["billing", "api", "integrations"].includes(tab) && (
                <div className="settings-panel">
                    <h3>{tabs.find((t) => t[0] === tab)?.[2]}</h3>
                    <p>
                        Configuracao preparada para ativacao. Os controlos ja
                        respondem e mantem a area operacional.
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() =>
                            setMsg(
                                "Acao registada. Esta area pode ser ligada ao backend quando quiseres.",
                            )
                        }
                    >
                        Gerir
                    </Button>
                </div>
            )}
        </>
    );
}
function App() {
    const auth = useAuth();
    if (auth.loading)
        return (
            <div className="center">
                <Loader2 className="spin" /> A carregar OnBoarding
            </div>
        );
    if (!auth.token || !auth.user) return <PublicShell onAuth={auth.save} />;
    return <Layout user={auth.user} logout={auth.logout} />;
}
createRoot(document.getElementById("root")).render(<App />);
