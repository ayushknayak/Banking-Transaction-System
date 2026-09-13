import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { Toaster, toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Copy,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Sparkles,
  Plus,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { api, getAccountBalance, getAccountLabel, getApiErrorMessage, warmUpService, type Account, type Transaction } from "@/lib/api";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function formatMoney(value: number | null | undefined) {
  return typeof value === "number" ? money.format(value) : "—";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : dateTime.format(date);
}

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={`brand ${compact ? "brand--compact" : ""}`} aria-label="Go to Ledger homepage"><span className="brand-mark"><span /></span><span><strong>Ledger</strong>{!compact && <small>Transaction platform</small>}</span></Link>;
}

function Button({ children, variant = "primary", className = "", type = "button", disabled = false, onClick }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void }) {
  return <button type={type} className={`button button--${variant} ${className}`} disabled={disabled} onClick={onClick}>{children}</button>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Field({ label, id, hint, ...props }: { label: string; id: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="field" htmlFor={id}><span className="field-label">{label}</span><input id={id} {...props} />{hint && <span className="field-hint">{hint}</span>}</label>;
}

function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={`status status--${tone}`}><span className="status-dot" />{children}</span>;
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="loading-list">{Array.from({ length: count }, (_, index) => <div className="loading-row" key={index}><span /><span /><span /><span /></div>)}</div>;
}

function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <div className="state state--error"><CircleAlert size={18} /><div><strong>{title}</strong><p>{message}</p></div>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</div>;
}

function EmptyState({ icon: Icon = CircleHelp, title, message, action }: { icon?: typeof CircleHelp; title: string; message: string; action?: ReactNode }) {
  return <div className="state state--empty"><Icon size={20} /><div><strong>{title}</strong><p>{message}</p>{action && <div className="state-action">{action}</div>}</div></div>;
}


function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}><span className="theme-toggle-icon">{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</span><span>{theme === "light" ? "Dark" : "Light"}</span></button>;
}

function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  useEffect(() => { void warmUpService(); }, []);
  const signOut = async () => { await logout(); toast.success("Signed out"); };
  return <main className="landing-page">
    <header className="landing-header"><div className="landing-brand"><Logo /></div><nav className="landing-nav" aria-label="Landing page navigation"><a href="#system">Product</a><a href="#integrity">Reliability</a><a href="#architecture">Technology</a></nav><div className="landing-actions"><ThemeToggle />{isAuthenticated ? <><span className="landing-user-chip"><span className="avatar avatar--tiny">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</span><span>{user?.name || user?.email || "Signed in"}</span></span><button className="logout-button" aria-label="Log out of Ledger" onClick={signOut}><LogOut size={15} /><span>Logout</span></button></> : <><Link href="/login" className="landing-signin">Sign in</Link><Button onClick={() => navigate("/register")}>Open Ledger <ArrowRight size={15} /></Button></>}</div></header>
    <section className="landing-hero"><div className="landing-hero-copy"><span className="eyebrow landing-eyebrow"><Sparkles size={13} /> Banking transaction infrastructure</span><h1>Transactions,<br /><em>handled with integrity.</em></h1><p>Ledger is a secure banking transaction platform for managing accounts, balances, and financial activity with reliable processing and an immutable ledger.</p><div className="landing-cta"><Button onClick={() => navigate("/register")}>Open Ledger <ArrowRight size={16} /></Button><a href="#system" className="landing-text-link">Explore the system <ChevronRight size={15} /></a></div><div className="landing-note"><ShieldCheck size={15} /> Securely connected to the deployed banking service</div></div><div className="landing-visual" aria-label="Ledger product interface preview"><div className="visual-orbit visual-orbit--one" /><div className="visual-orbit visual-orbit--two" /><div className="visual-panel visual-panel--main"><div className="visual-panel-top"><span className="visual-overline">LEDGER / SYSTEM</span><StatusBadge tone="success">Protected route</StatusBadge></div><div className="visual-title">Processed<br /><strong>with integrity</strong></div><div className="visual-line"><span>Authenticated request</span><Check size={15} /></div><div className="visual-line"><span>Idempotency protected</span><Check size={15} /></div><div className="visual-line"><span>Immutable record</span><Check size={15} /></div></div><div className="visual-chip visual-chip--top"><span className="chip-dot" /> Account balance</div><div className="visual-chip visual-chip--bottom"><ShieldCheck size={14} /> Atomic transaction flow</div></div></section>
    <section className="landing-proof"><span>One focused system for financial activity</span><div><strong>Accounts</strong><strong>Balances</strong><strong>Transfers</strong><strong>Ledger</strong></div></section>
    <section className="landing-system" id="system"><div className="landing-section-intro"><span className="eyebrow">The product</span><h2>Built around the<br /><em>transaction record.</em></h2><p>Ledger keeps the experience narrow and useful: authenticate, operate on an account, and leave a reliable record behind.</p></div><div className="system-grid"><article><div className="system-icon"><Landmark size={19} /></div><span className="principle-number">01 / ACCOUNTS</span><h3>Account management</h3><p>Create and view the accounts returned by the service, with balances derived from the connected ledger.</p></article><article><div className="system-icon"><Send size={19} /></div><span className="principle-number">02 / PROCESSING</span><h3>Reliable transfers</h3><p>Review and confirm supported money movement with server validation and duplicate-safe request handling.</p></article><article><div className="system-icon"><BookOpen size={19} /></div><span className="principle-number">03 / RECORD</span><h3>Immutable ledger</h3><p>Transactions are treated as a persistent financial record rather than ordinary editable history.</p></article></div></section>
    <section className="landing-integrity" id="integrity"><div className="integrity-visual"><div className="integrity-request"><span className="integrity-label">REQUEST</span><strong>transfer_001</strong><small>amount · validated</small></div><div className="integrity-arrow"><ArrowRight size={18} /></div><div className="integrity-request integrity-request--accent"><span className="integrity-label">RECORD</span><strong>accepted once</strong><small>idempotency key · matched</small></div></div><div className="landing-section-intro"><span className="eyebrow">Transaction integrity</span><h2>Safe to retry.<br /><em>Hard to duplicate.</em></h2><p>When a request is retried after a network issue, the same idempotency key lets the backend recognize the existing operation instead of creating another one.</p><div className="integrity-points"><span><Check size={14} /> Unique request key</span><span><Check size={14} /> Atomic processing</span><span><Check size={14} /> Clear result state</span></div></div></section>
    <section className="landing-architecture" id="architecture"><div className="landing-section-intro"><span className="eyebrow">Security & architecture</span><h2>A simple path from<br /><em>request to record.</em></h2><p>The frontend stays close to the backend contract, with protected routes and persistent data doing the important work.</p></div><div className="architecture-flow"><div><span>01</span><strong>React client</strong><small>Focused, responsive interface</small></div><i /><div><span>02</span><strong>JWT auth</strong><small>Protected API routes</small></div><i /><div><span>03</span><strong>Express API</strong><small>Validation and transaction flow</small></div><i /><div><span>04</span><strong>MongoDB</strong><small>Persistent account records</small></div></div></section>
    <section className="landing-preview"><div className="preview-heading"><div><span className="eyebrow">Product interface</span><h2>Everything important,<br /><em>close at hand.</em></h2></div><p>The application is designed for clarity across the account overview, transfer review, and ledger-oriented record.</p></div><div className="preview-window"><div className="preview-sidebar"><Logo compact /><span className="preview-active">Overview</span><span>Account</span><span>Transfers</span><span>Ledger</span></div><div className="preview-main"><div className="preview-topline"><span>Good afternoon, Ayush.</span><StatusBadge tone="success">Active</StatusBadge></div><small>AVAILABLE BALANCE</small><strong>₹ —</strong><div className="preview-actions"><span>Make a transfer <ArrowRight size={13} /></span><span>View account <ArrowRight size={13} /></span></div><div className="preview-record"><span>RECENT ACTIVITY</span><div>Authenticated activity appears here</div></div></div></div></section>
    <section className="landing-bottom"><div><span className="eyebrow">Experience the system</span><h2>Open the record.<br /><em>See it clearly.</em></h2></div><Button onClick={() => navigate("/register")}>Open Ledger <ArrowRight size={16} /></Button></section>
    <footer className="landing-footer"><Logo compact /><span>© 2026 Ledger. Demonstration banking transaction system.</span><Link href="/login">Sign in</Link></footer>
  </main>;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (isAuthenticated) navigate("/app/overview"); }, [isAuthenticated, navigate]);
  useEffect(() => { void warmUpService(); }, []);
  useEffect(() => {
    if (!isLoading) { setLoadingPhase(0); return; }
    setLoadingPhase(1);
    const first = window.setTimeout(() => setLoadingPhase(2), 2500);
    const second = window.setTimeout(() => setLoadingPhase(3), 7000);
    return () => { window.clearTimeout(first); window.clearTimeout(second); };
  }, [isLoading]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register" && !name.trim()) return setError("Enter your name to continue.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Your password must be at least 6 characters.");
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      toast.success(mode === "login" ? "Signed in" : "Account created");
      navigate("/app/overview");
    } catch (next) {
      setError(getApiErrorMessage(next));
    }
  };

  return <main className="auth-layout"><div className="auth-intro"><div className="auth-logo-link"><Logo /></div><div className="auth-copy"><span className="eyebrow">A clearer view of your money</span><h1>Banking with a record you can trust.</h1><p>Ledger brings your account balance and every supported movement into one calm, focused workspace.</p></div><div className="auth-foot"><ShieldCheck size={15} /> Securely connected to your banking service</div></div><div className="auth-panel"><div className="auth-panel-inner"><div className="auth-topbar"><span className="mobile-brand"><Logo /></span><ThemeToggle /></div><div className="auth-heading"><span className="eyebrow">{mode === "login" ? "Welcome back" : "Get started"}</span><h2>{mode === "login" ? "Sign in to Ledger" : "Create your Ledger account"}</h2><p>{mode === "login" ? "Use the credentials associated with your banking account." : "Your account is created through the connected banking service."}</p></div><form onSubmit={submit} className="stack-form">{mode === "register" && <Field label="Full name" id="name" value={name} onChange={event => setName(event.target.value)} placeholder="Ayush Sharma" autoComplete="name" /> }<Field label="Email address" id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /><Field label="Password" id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />{error && <div className="form-error" role="alert"><CircleAlert size={16} />{error}</div>}<Button type="submit" disabled={isLoading} className="button--full">{isLoading ? loadingPhase >= 3 ? "Still connecting…" : loadingPhase >= 2 ? "Waking service…" : "Connecting…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></Button>{isLoading && <p className="auth-loading-note" role="status">{loadingPhase >= 3 ? "The banking service is taking a little longer to wake up. Please keep this tab open." : "The first request may take a few seconds while the banking service wakes up."}</p>}</form><div className="auth-switch">{mode === "login" ? <>New to Ledger? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</div><p className="auth-note">By continuing, you agree to use this demonstration banking system responsibly.</p></div></div></main>;
}

const navItems = [
  { href: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/app/account", label: "Account", icon: WalletCards },
  { href: "/app/transactions", label: "Transactions", icon: ArrowUpRight },
  { href: "/app/transaction", label: "Make a transfer", icon: Send },
  { href: "/app/ledger", label: "Ledger", icon: BookOpen },
];

function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeHref = navItems.find(item => location === item.href || location.startsWith(`${item.href}/`))?.href;
  const displayName = user?.name || user?.email?.split("@")[0] || "there";

  const signOut = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  };

  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}><div className="sidebar-top"><Logo /><div className="sidebar-top-actions"><ThemeToggle /><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button></div></div><nav className="nav-list" aria-label="Main navigation">{navItems.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-item ${activeHref === item.href ? "nav-item--active" : ""}`} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{activeHref === item.href && <span className="nav-active-dot" />}</Link>; })}</nav><div className="sidebar-bottom"><Link href="/app/settings" className={`nav-item ${location === "/app/settings" ? "nav-item--active" : ""}`} onClick={() => setMobileOpen(false)}><Settings size={17} strokeWidth={1.8} /><span>Settings</span></Link><div className="user-mini"><span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{user?.email || "Connected account"}</small></div><button className="logout-button" aria-label="Log out of Ledger" onClick={signOut}><LogOut size={15} /><span>Logout</span></button></div></div></aside>{mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> }<div className="app-main"><header className="mobile-header"><button className="icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><Logo compact /><div className="mobile-header-actions"><ThemeToggle /><span className="mobile-user-name">{displayName}</span><button className="logout-button mobile-logout" aria-label="Log out of Ledger" onClick={signOut}><LogOut size={15} /><span>Logout</span></button></div></header><main className="page-wrap">{children}</main></div></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function AccountOverview({ accounts, balances, onCreate }: { accounts: Account[]; balances: Record<string, number | null>; onCreate: () => void }) {
  return <Card className="account-overview"><div className="section-label">Primary account</div>{accounts.length ? <div className="account-row"><div className="account-icon"><Landmark size={20} /></div><div className="account-details"><strong>{getAccountLabel(accounts[0])}</strong><span>Account ID <button className="copy-button" onClick={() => { navigator.clipboard?.writeText(accounts[0]._id); toast.success("Account ID copied"); }} aria-label="Copy account ID"><Copy size={13} /></button></span></div><div className="account-balance"><span>Available balance</span><strong>{formatMoney(balances[accounts[0]._id] ?? getAccountBalance(accounts[0]))}</strong></div><StatusBadge tone={accounts[0].status?.toLowerCase() === "active" ? "success" : "warning"}>{accounts[0].status || "Active"}</StatusBadge></div> : <EmptyState icon={CreditCard} title="No account yet" message="Create your first account to start using Ledger." action={<Button onClick={onCreate}>Create account</Button>} />}</Card>;
}

function OverviewPage() {
  const { token, user, handleUnauthorized } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [, navigate] = useLocation();

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await api.accounts.list(token);
      const nextAccounts = response.accounts || [];
      setAccounts(nextAccounts);
      const balanceEntries = await Promise.all(nextAccounts.map(async account => {
        try { const data = await api.accounts.balance(account._id, token); return [account._id, getAccountBalance(account, data.balance)] as const; }
        catch (next) { if ((next as { status?: number }).status === 401) handleUnauthorized(); return [account._id, getAccountBalance(account)] as const; }
      }));
      setBalances(Object.fromEntries(balanceEntries));
    } catch (next) {
      if ((next as { status?: number }).status === 401) handleUnauthorized();
      setError(getApiErrorMessage(next));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createAccount = async () => {
    setCreating(true);
    try { await api.accounts.create(token); toast.success("Account created"); await load(); }
    catch (next) { toast.error(getApiErrorMessage(next)); }
    finally { setCreating(false); }
  };

  const balance = accounts[0] ? balances[accounts[0]._id] ?? getAccountBalance(accounts[0]) : null;
  return <><PageHeader eyebrow="Overview" title={`${getGreeting()}, ${user?.name?.split(" ")[0] || "there"}.`} description="A calm view of your connected banking account." action={<Button variant="secondary" onClick={load}><RefreshCcw size={15} /> Refresh</Button>} />{error ? <ErrorState title="Unable to load your account" message={error} onRetry={load} /> : loading ? <><div className="balance-hero"><div className="skeleton skeleton-label" /><div className="skeleton skeleton-balance" /></div><LoadingRows count={3} /></> : <><div className="balance-hero"><div><span className="eyebrow">Available balance</span><strong>{formatMoney(balance)}</strong><span className="balance-meta"><span className="pulse-dot" /> Live from the banking service</span></div><div className="balance-aside"><span>Account status</span><StatusBadge tone="success">{accounts[0]?.status || "Active"}</StatusBadge></div></div><div className="quick-actions"><Link href="/app/transaction" className="quick-action quick-action--primary"><span><Send size={18} /><strong>Make a transfer</strong><small>Move funds securely</small></span><ArrowRight size={18} /></Link><button className="quick-action" onClick={() => accounts.length ? navigate("/app/account") : createAccount()} disabled={creating}><span><Plus size={18} /><strong>{accounts.length ? "View account" : creating ? "Creating…" : "Create account"}</strong><small>{accounts.length ? "Account details" : "Open your first account"}</small></span><ArrowRight size={18} /></button></div><div className="overview-grid"><AccountOverview accounts={accounts} balances={balances} onCreate={createAccount} /><Card><div className="card-heading"><div><span className="section-label">Recent activity</span><h2>Transactions</h2></div><Link href="/app/transactions" className="text-link">View all <ChevronRight size={14} /></Link></div><EmptyState icon={ArrowUpRight} title="Review transaction activity" message="Open the Transactions page to review authenticated activity returned by the banking service." action={<Link href="/app/transaction" className="text-link">Make a transfer <ArrowRight size={14} /></Link>} /></Card></div></>}</>;
}

function AccountPage() {
  const { token, handleUnauthorized } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const response = await api.accounts.list(token); const next = response.accounts || []; const withBalances = await Promise.all(next.map(async account => { try { const data = await api.accounts.balance(account._id, token); return { ...account, balance: data.balance }; } catch { return account; } })); setAccounts(withBalances); } catch (next) { if ((next as { status?: number }).status === 401) handleUnauthorized(); setError(getApiErrorMessage(next)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <><PageHeader eyebrow="Account" title="Your banking account" description="Account information returned by the connected service." action={<Button variant="secondary" onClick={load}><RefreshCcw size={15} /> Refresh</Button>} />{error ? <ErrorState title="Unable to load account details" message={error} onRetry={load} /> : loading ? <LoadingRows count={3} /> : accounts.length ? <div className="account-list">{accounts.map(account => <Card key={account._id} className="account-detail-card"><div className="account-detail-top"><div className="account-icon"><Landmark size={20} /></div><div><span className="section-label">Bank account</span><h2>{getAccountLabel(account)}</h2><p className="muted">Account ID {account._id}</p></div><StatusBadge tone={account.status?.toLowerCase() === "active" ? "success" : "warning"}>{account.status || "Active"}</StatusBadge></div><div className="detail-grid"><div><span>Available balance</span><strong>{formatMoney(account.balance)}</strong></div><div><span>Created</span><strong>{formatDate(account.createdAt)}</strong></div><div><span>Record type</span><strong>Ledger-backed</strong></div></div></Card>)}</div> : <EmptyState icon={CreditCard} title="No account found" message="Create an account from the overview to start using Ledger." action={<Link href="/app/overview" className="text-link">Back to overview <ArrowRight size={14} /></Link>} />}</>;
}

function TransactionPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Transaction | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => { api.accounts.list(token).then(response => { const next = response.accounts || []; setAccounts(next); if (next[0]) setFromAccount(next[0]._id); }).catch(next => setError(getApiErrorMessage(next))); }, []);
  const selectedAccount = accounts.find(account => account._id === fromAccount);
  const numericAmount = Number(amount);
  const canContinue = Boolean(fromAccount && toAccount.trim() && numericAmount > 0 && toAccount.trim() !== fromAccount);
  const submit = async () => {
    setBusy(true); setError("");
    const idempotencyKey = crypto.randomUUID();
    const payload = { fromAccount, toAccount: toAccount.trim(), amount: numericAmount, idempotencyKey };
    try {
      const response = await api.transactions.create(payload, token);
      setResult(response.transaction || { ...payload, status: "Completed" }); setStep("success"); toast.success("Transfer completed");
    } catch (next) {
      // Render/proxy wake-ups can drop the response after the backend commits.
      // Reconcile by idempotency key before telling the user the transfer failed.
      try {
        const history = await api.transactions.history(fromAccount, token);
        const committed = (history.transactions || []).find(transaction => transaction.idempotencyKey === idempotencyKey);
        if (committed) {
          setResult(committed); setStep("success"); toast.success("Transfer completed"); return;
        }
      } catch {
        // Preserve the original, more useful error below.
      }
      setError(getApiErrorMessage(next));
    } finally { setBusy(false); }
  };
  if (step === "success") return <><PageHeader eyebrow="Transfer complete" title="Money moved successfully" description="The banking service accepted the transfer request." /><Card className="success-card"><div className="success-icon"><Check size={22} /></div><span className="eyebrow">Completed</span><strong>{formatMoney(result?.amount ?? numericAmount)}</strong><p>Transfer from {getAccountLabel(selectedAccount || { _id: fromAccount })} to <span className="mono">{toAccount.slice(-8)}</span></p><div className="success-details"><div><span>Transaction ID</span><strong className="mono">{result?._id || "Returned by service"}</strong></div><div><span>Date</span><strong>{formatDate(result?.createdAt) || "Just now"}</strong></div><div><span>Status</span><StatusBadge tone="success">{result?.status || "Completed"}</StatusBadge></div></div><div className="success-actions"><Button onClick={() => { setStep("form"); setAmount(""); setToAccount(""); setResult(null); }}>Make another transfer</Button><Button variant="secondary" onClick={() => navigate("/app/overview")}>Back to overview</Button></div></Card></>;
  return <><PageHeader eyebrow="Move money" title="Make a transfer" description="The connected backend models credit and debit as an idempotent transfer between accounts." />{error && <div className="form-error form-error--wide" role="alert"><CircleAlert size={16} />{error}</div>}<div className="transaction-layout"><Card className="transaction-form-card"><div className="step-indicator"><span className={step === "form" ? "is-current" : "is-done"}>1 <small>Details</small></span><i /><span className={step === "review" ? "is-current" : ""}>2 <small>Review</small></span></div>{step === "form" ? <form className="stack-form" onSubmit={event => { event.preventDefault(); if (canContinue) setStep("review"); }}><label className="field"><span className="field-label">From account</span><select value={fromAccount} onChange={event => setFromAccount(event.target.value)}><option value="">Select an account</option>{accounts.map(account => <option key={account._id} value={account._id}>{getAccountLabel(account)}{typeof account.balance === "number" ? ` · ${formatMoney(account.balance)}` : ""}</option>)}</select></label><Field label="Recipient account ID" id="recipient" value={toAccount} onChange={event => setToAccount(event.target.value)} placeholder="Paste the recipient account ID" hint="Use the full account ID supplied by the recipient." /><Field label="Amount" id="amount" value={amount} onChange={event => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0.00" hint="Amount is validated by the banking service." /><Button type="submit" disabled={!canContinue}>Review transfer <ArrowRight size={16} /></Button></form> : <div className="review-panel"><div className="review-row"><span>From</span><strong>{getAccountLabel(selectedAccount || { _id: fromAccount })}</strong></div><div className="review-row"><span>To</span><strong className="mono">{toAccount}</strong></div><div className="review-row review-row--amount"><span>Amount</span><strong>{formatMoney(numericAmount)}</strong></div><div className="review-note"><ShieldCheck size={16} /><span>Each request carries a unique idempotency key. If the network retries it, the same request remains safe to replay.</span></div><div className="button-row"><Button variant="secondary" onClick={() => setStep("form")} disabled={busy}>Edit</Button><Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Confirm transfer"}<Check size={16} /></Button></div></div>}</Card><div className="transaction-aside"><div className="aside-kicker"><ShieldCheck size={16} /> Protected by the ledger</div><h2>One clear record for every movement.</h2><p>This screen only sends requests the deployed service documents: an authenticated transfer with a server-validated amount and idempotency key.</p><div className="aside-list"><div><Check size={15} /> Atomic backend transaction</div><div><Check size={15} /> Duplicate-safe retries</div><div><Check size={15} /> No local financial values</div></div></div></div></>;
}

function TransactionHistoryPage() {
  const { token, handleUnauthorized } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const accountsResponse = await api.accounts.list(token);
      const primary = accountsResponse.accounts?.[0] || null;
      setAccount(primary);
      if (!primary) { setTransactions([]); return; }
      const response = await api.transactions.history(primary._id, token);
      setTransactions(response.transactions || []);
    } catch (next) {
      if ((next as { status?: number }).status === 401) handleUnauthorized();
      setError(getApiErrorMessage(next));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return <><PageHeader eyebrow="Activity" title="Transactions" description="Review the authenticated transaction history for your account." action={<Button variant="secondary" onClick={load}><RefreshCcw size={15} /> Refresh</Button>} />{error ? <ErrorState title="Unable to load transaction history" message={error} onRetry={load} /> : loading ? <LoadingRows count={4} /> : !account ? <EmptyState icon={CreditCard} title="No account found" message="Create an account before reviewing transaction activity." action={<Link href="/app/overview" className="text-link">Back to overview <ArrowRight size={14} /></Link>} /> : transactions.length === 0 ? <Card><EmptyState icon={ArrowUpRight} title="No transactions yet" message="Completed transfers for this account will appear here." action={<Link href="/app/transaction" className="text-link">Make a transfer <ArrowRight size={14} /></Link>} /></Card> : <Card className="history-card"><div className="history-heading"><div><span className="section-label">Account activity</span><h2>{getAccountLabel(account)}</h2></div><StatusBadge tone="success">{transactions.length} record{transactions.length === 1 ? "" : "s"}</StatusBadge></div><div className="transaction-history" role="list">{transactions.map(transaction => <div className="transaction-row" role="listitem" key={transaction._id || transaction.idempotencyKey}><div className="transaction-direction"><span className={transaction.fromAccount === account._id ? "transaction-icon transaction-icon--out" : "transaction-icon transaction-icon--in"}>{transaction.fromAccount === account._id ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</span><div><strong>{transaction.fromAccount === account._id ? "Transfer sent" : "Transfer received"}</strong><small>{formatDate(transaction.createdAt)}</small></div></div><div className="transaction-party"><span>{transaction.fromAccount === account._id ? "To" : "From"}</span><strong className="mono">{(transaction.fromAccount === account._id ? transaction.toAccount : transaction.fromAccount) || "—"}</strong></div><div className="transaction-amount"><strong className={transaction.fromAccount === account._id ? "amount-out" : "amount-in"}>{transaction.fromAccount === account._id ? "−" : "+"}{formatMoney(transaction.amount)}</strong><StatusBadge tone={transaction.status?.toLowerCase() === "completed" ? "success" : "neutral"}>{transaction.status || "Processed"}</StatusBadge></div></div>)}</div></Card>}</>;
}

function UnsupportedPage({ kind }: { kind: "ledger" }) {
  return <><PageHeader eyebrow="Immutable record" title="Ledger" description="A focused view of the immutable record behind your account." /><Card><EmptyState icon={BookOpen} title="Ledger read access is not exposed" message="The deployed backend describes immutable ledger entries, but currently publishes no authenticated GET endpoint for reading them. This view will not fabricate ledger rows." action={<Link href="/app/transaction" className="text-link">Make a supported transfer <ArrowRight size={14} /></Link>} /></Card><div className="contract-note"><CircleHelp size={16} /><div><strong>Backend contract note</strong><p>When a ledger read endpoint is added, this page can be connected through the centralized API service without changing the surrounding interface.</p></div></div></>;
}

function SettingsPage() {
  const { user, token } = useAuth();
  return <><PageHeader eyebrow="Preferences" title="Settings" description="Your connected session and client preferences." /><div className="settings-grid"><Card><div className="card-heading"><div><span className="section-label">Profile</span><h2>Account identity</h2></div><UserRound size={20} className="muted-icon" /></div><div className="settings-row"><span>Name</span><strong>{user?.name || "Not returned by service"}</strong></div><div className="settings-row"><span>Email</span><strong>{user?.email || "Not returned by service"}</strong></div></Card><Card><div className="card-heading"><div><span className="section-label">Connection</span><h2>Service status</h2></div><ShieldCheck size={20} className="muted-icon" /></div><div className="settings-row"><span>Backend</span><strong className="mono">{api.baseUrl.replace("https://", "")}</strong></div><div className="settings-row"><span>Session</span><StatusBadge tone="success">Authenticated</StatusBadge></div><p className="settings-note">Authentication is sent through the service cookie when available, with a Bearer token fallback if the backend returns one. Credentials are never displayed here.</p></Card></div></>;
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <AppShell><Switch><Route path="/app/overview" component={OverviewPage} /><Route path="/app/account" component={AccountPage} /><Route path="/app/transaction" component={TransactionPage} /><Route path="/app/transactions" component={TransactionHistoryPage} /><Route path="/app/ledger" component={() => <UnsupportedPage kind="ledger" />} /><Route path="/app/settings" component={SettingsPage} /><Route><OverviewPage /></Route></Switch></AppShell>;
}

function Router() {
  return <Switch><Route path="/"><LandingPage /></Route><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route><Route path="/app/:rest*"><ProtectedApp /></Route><Route><AuthGate /></Route></Switch>;
}

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { navigate(isAuthenticated ? "/app/overview" : "/login"); }, [isAuthenticated, navigate]);
  return null;
}

export default function App() {
  return <ThemeProvider defaultTheme="light" switchable><AuthProvider><Toaster position="top-right" toastOptions={{ classNames: { toast: "ledger-toast" } }} /><Router /></AuthProvider></ThemeProvider>;
}
