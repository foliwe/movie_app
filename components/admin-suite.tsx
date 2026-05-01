"use client";

import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Eye,
  Film,
  FolderOpen,
  Gauge,
  Home,
  ImageIcon,
  Layers3,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Star,
  Sun,
  Tags,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { MovieArtwork } from "@/components/site";
import type { AuthUser } from "@/lib/auth";
import type { AdminSuiteGenre, AdminSuiteUser } from "@/lib/admin-suite-data";
import type { Movie, Person, Review } from "@/lib/movies";

type AdminSuiteData = {
  movies: Movie[];
  people: Person[];
  reviews: Review[];
  genres: AdminSuiteGenre[];
  users: AdminSuiteUser[];
  languages: string[];
};

type AdminShellProps = {
  user: AuthUser;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "Titles", href: "/admin/movies", icon: Film },
  { label: "People", href: "/admin/people", icon: Users },
  { label: "Genres", href: "/admin/genres", icon: Tags },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Users", href: "/admin/users", icon: Shield },
  { label: "Media Assets", href: "/admin/media", icon: ImageIcon },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const quickActions = [
  { label: "Add New Title", href: "/admin/movies/new", icon: Plus },
  { label: "Import Data", href: "/admin/media", icon: Upload },
  { label: "Bulk Update", href: "/admin/movies", icon: RefreshCw },
  { label: "Moderation Queue", href: "/admin/reviews", icon: AlertTriangle, badge: "34" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function getPrimaryMovie(data: AdminSuiteData) {
  return [...data.movies].sort((left, right) => right.rating - left.rating || right.reviews - left.reviews)[0] ?? null;
}

function statusClass(status: string) {
  if (status === "Published" || status === "Approved" || status === "Active" || status === "Admin") {
    return "is-success";
  }

  if (status === "Pending" || status === "Draft" || status === "Festival") {
    return "is-warning";
  }

  if (status === "Hidden" || status === "Suspended") {
    return "is-danger";
  }

  return "";
}

export function AdminShell({ user, title, subtitle, children, actions }: AdminShellProps) {
  const pathname = usePathname() ?? "";

  return (
    <main className="cineverse-admin-app" data-testid="admin-shell">
      <aside className="cineverse-sidebar">
        <Link className="cineverse-brand" href="/" aria-label="Go to the Cineverse home page">
          <span className="cineverse-logo-mark">
            <Film size={28} fill="currentColor" />
          </span>
          <span>
            <strong>CINEVERSE</strong>
            <small>Movie Database</small>
          </span>
        </Link>

        <nav className="cineverse-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link className={clsx("cineverse-nav-link", active && "is-active")} href={item.href} key={item.href}>
                <Icon size={21} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="cineverse-quick-actions">
          <span>Quick Actions</span>
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge ? <strong>{item.badge}</strong> : null}
              </Link>
            );
          })}
        </div>

        <div className="cineverse-admin-user">
          <div className="cineverse-avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user.displayName}</strong>
            <span>Super Administrator</span>
          </div>
          <ChevronRight size={16} />
        </div>
      </aside>

      <section className="cineverse-main">
        <header className="cineverse-topbar">
          <div className="cineverse-page-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="cineverse-topbar-actions">
            <label className="cineverse-search">
              <Search size={18} />
              <input placeholder="Search titles, people, genres..." aria-label="Admin search" />
              <kbd>⌘K</kbd>
            </label>
            {actions}
            <button type="button" aria-label="Notifications">
              <Bell size={20} />
              <span>7</span>
            </button>
            <button type="button" aria-label="Messages">
              <Mail size={20} />
            </button>
            <button type="button" aria-label="Theme">
              <Sun size={20} />
            </button>
          </div>
        </header>

        <div className="cineverse-content">{children}</div>
      </section>
    </main>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Home;
  tone?: "amber" | "green" | "red" | "blue" | "purple";
}) {
  return (
    <article className={clsx("cineverse-metric", `is-${tone}`)}>
      <div>
        <Icon size={32} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AdminPanel({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("cineverse-panel", className)}>
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function MoviePoster({ movie, className }: { movie: Movie; className?: string }) {
  return <MovieArtwork movie={movie} className={clsx("cineverse-poster", className)} variant="posterSidebar" hideTitleWhenImage />;
}

function MovieWideArt({ movie }: { movie: Movie }) {
  return <MovieArtwork movie={movie} className="cineverse-wide-art" variant="posterRail" hideTitleWhenImage />;
}

function PersonAvatar({ person, size = "normal" }: { person: Person; size?: "normal" | "large" }) {
  return (
    <div className={clsx("cineverse-person-avatar", size === "large" && "is-large")}>
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt={person.name} />
      ) : (
        <span>{person.name.slice(0, 1)}</span>
      )}
    </div>
  );
}

type ActionMenuItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
};

type ActionButtonsProps = {
  itemLabel: string;
  onView?: () => void;
  viewHref?: string;
  onEdit?: () => void;
  editHref?: string;
  menuItems?: ActionMenuItem[];
};

type DetailTabOption<T extends string> = {
  id: T;
  label: string;
};

function ActionButtons({ itemLabel, onView, viewHref, onEdit, editHref, menuItems = [] }: ActionButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleAction(event: ReactMouseEvent<HTMLElement>, callback?: () => void) {
    event.stopPropagation();
    callback?.();
    closeMenu();
  }

  return (
    <div className="cineverse-row-actions" ref={menuRef}>
      {viewHref ? (
        <Link
          className="cineverse-icon-button"
          href={viewHref}
          aria-label={`View ${itemLabel}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Eye size={15} />
        </Link>
      ) : (
        <button type="button" className="cineverse-icon-button" aria-label={`View ${itemLabel}`} onClick={(event) => handleAction(event, onView)}>
          <Eye size={15} />
        </button>
      )}
      {editHref ? (
        <Link
          className="cineverse-icon-button"
          href={editHref}
          aria-label={`Edit ${itemLabel}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Pencil size={15} />
        </Link>
      ) : (
        <button type="button" className="cineverse-icon-button" aria-label={`Edit ${itemLabel}`} onClick={(event) => handleAction(event, onEdit)}>
          <Pencil size={15} />
        </button>
      )}
      <button
        type="button"
        className="cineverse-icon-button"
        aria-label={`More options for ${itemLabel}`}
        aria-expanded={menuOpen}
        disabled={menuItems.length === 0}
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((current) => !current);
        }}
      >
        <MoreVertical size={15} />
      </button>
      {menuOpen ? (
        <div className="cineverse-action-menu">
          {menuItems.map((item) =>
            item.href ? (
              <Link
                className="cineverse-action-menu-item"
                href={item.href}
                key={item.label}
                onClick={(event) => {
                  event.stopPropagation();
                  closeMenu();
                }}
              >
                {item.label}
              </Link>
            ) : (
              <button
                type="button"
                className="cineverse-action-menu-item"
                key={item.label}
                onClick={(event) => handleAction(event, item.onSelect)}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function DetailTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: DetailTabOption<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="cineverse-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          key={tab.id}
          className={clsx(activeTab === tab.id && "is-active")}
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MiniBars({ values, tone = "amber" }: { values: number[]; tone?: "amber" | "green" | "red" }) {
  const max = Math.max(...values, 1);

  return (
    <div className={clsx("cineverse-mini-bars", `is-${tone}`)}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(14, (value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function LineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="cineverse-line-chart">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(10, (value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function DonutLegend({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const gradient = items
    .reduce(
      (segments, item) => {
        const start = segments.cursor;
        const end = start + (item.value / total) * 100;
        segments.parts.push(`${item.color} ${start}% ${end}%`);
        segments.cursor = end;
        return segments;
      },
      { cursor: 0, parts: [] as string[] },
    )
    .parts.join(", ");

  return (
    <div className="cineverse-donut-wrap">
      <div className="cineverse-donut" style={{ background: `conic-gradient(${gradient})` }}>
        <span>{formatCompact(total)}</span>
      </div>
      <div className="cineverse-legend">
        {items.map((item) => (
          <p key={item.label}>
            <i style={{ background: item.color }} />
            <span>{item.label}</span>
            <strong>{Math.round((item.value / total) * 100)}%</strong>
          </p>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardView({ data }: { data: AdminSuiteData }) {
  const featured = getPrimaryMovie(data);
  const pendingReviews = data.reviews.filter((review) => review.status === "Pending").length;
  const genreItems = data.genres.slice(0, 6).map((genre, index) => ({
    label: genre.name,
    value: genre.movieCount,
    color: ["#f8b400", "#2fce74", "#ef4444", "#60a5fa", "#a16207", "#94a3b8"][index] ?? "#f8b400",
  }));

  return (
    <div className="cineverse-dashboard-grid">
      <div className="cineverse-metric-grid">
        <AdminMetricCard label="Total Titles" value={formatNumber(data.movies.length)} detail="Live catalogue records" icon={Film} />
        <AdminMetricCard label="People" value={formatNumber(data.people.length)} detail="Cast and crew profiles" icon={Users} tone="green" />
        <AdminMetricCard label="User Reviews" value={formatNumber(data.reviews.length)} detail={`${pendingReviews} pending`} icon={Star} />
        <AdminMetricCard label="Users" value={formatNumber(data.users.length)} detail="Registered accounts" icon={Shield} tone="blue" />
      </div>

      <div className="cineverse-dashboard-left">
        <div className="cineverse-dashboard-main">
          <AdminPanel title="Database Growth">
            <LineChart values={[8, 12, 16, 19, 22, 24, 28, 31, 34, 37, 41, 45]} />
            <div className="cineverse-chart-footer">
              <strong>{formatNumber(data.movies.length)}</strong>
              <span>Total titles</span>
              <strong>{formatNumber(data.people.length)}</strong>
              <span>Total people</span>
            </div>
          </AdminPanel>
          <AdminPanel title="Ratings Distribution">
            <MiniBars values={[2, 5, 10, 24, 60]} />
            <div className="cineverse-chart-footer">
              <strong>{featured?.rating.toFixed(1) ?? "0.0"}/10</strong>
              <span>Top rating</span>
            </div>
          </AdminPanel>
          <AdminPanel title="Most Viewed Categories">
            <DonutLegend items={genreItems} />
          </AdminPanel>
        </div>

        <AdminPanel
          title="Recently Added Titles"
          className="cineverse-table-panel"
          action={<Link href="/admin/movies">View All Titles</Link>}
        >
          <AdminMovieTable movies={data.movies.slice(0, 6)} compact />
        </AdminPanel>
      </div>

      <aside className="cineverse-dashboard-side">
        {featured ? (
          <AdminPanel title="Featured Title">
            <div className="cineverse-featured-title">
              <MovieWideArt movie={featured} />
              <div>
                <h3>{featured.title}</h3>
                <p>
                  <Star size={14} fill="currentColor" /> {featured.rating.toFixed(1)}/10
                </p>
                <span>
                  {featured.releaseYear} · {Math.floor(featured.runtimeMinutes / 60)}h {featured.runtimeMinutes % 60}m ·{" "}
                  {featured.status}
                </span>
                <p>{featured.synopsis}</p>
                <Link href={`/admin/movies?movieId=${featured.id}`}>View Details</Link>
              </div>
            </div>
          </AdminPanel>
        ) : null}
        <AdminPanel title="Recent Activity">
          <div className="cineverse-activity-list">
            {([
              ["Title published", "Catalogue entry moved live", CheckCircle2],
              ["New review", "Community review submitted", Star],
              ["Media uploaded", "Poster assets were updated", Upload],
              ["Approval required", "Items are pending review", AlertTriangle],
            ] as const).map(([title, body, Icon]) => (
              <article key={title}>
                <Icon size={18} />
                <div>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>
      </aside>
    </div>
  );
}

type MovieDetailTab = "overview" | "details" | "media" | "reviews";
type PersonDetailTab = "overview" | "credits" | "media" | "awards";
type GenreDetailTab = "overview" | "titles" | "history";
type UserDetailTab = "overview" | "activity" | "security";

const movieDetailTabs: DetailTabOption<MovieDetailTab>[] = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details" },
  { id: "media", label: "Media" },
  { id: "reviews", label: "Reviews" },
];

const personDetailTabs: DetailTabOption<PersonDetailTab>[] = [
  { id: "overview", label: "Overview" },
  { id: "credits", label: "Credits" },
  { id: "media", label: "Media" },
  { id: "awards", label: "Awards" },
];

const genreDetailTabs: DetailTabOption<GenreDetailTab>[] = [
  { id: "overview", label: "Overview" },
  { id: "titles", label: "Titles" },
  { id: "history", label: "History" },
];

const userDetailTabs: DetailTabOption<UserDetailTab>[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "security", label: "Security" },
];

function isMovieDetailTab(value: string | null): value is MovieDetailTab {
  return movieDetailTabs.some((tab) => tab.id === value);
}

function AdminMovieTable({
  movies,
  compact = false,
  selectedMovieId,
  onSelectMovie,
}: {
  movies: Movie[];
  compact?: boolean;
  selectedMovieId?: string;
  onSelectMovie?: (movieId: string, tab?: MovieDetailTab) => void;
}) {
  return (
    <div className="cineverse-table-wrap">
      <table className="cineverse-table">
        <thead>
          <tr>
            <th>Title</th>
            {!compact ? <th>ID</th> : null}
            <th>Year</th>
            <th>Genres</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr
              key={movie.id}
              className={clsx(onSelectMovie && "is-selectable", selectedMovieId === movie.id && "is-selected")}
              onClick={onSelectMovie ? () => onSelectMovie(movie.id) : undefined}
            >
              <td>
                <div className="cineverse-title-cell">
                  <MoviePoster movie={movie} />
                  <span>
                    <strong>{movie.title}</strong>
                    <small>{movie.workflowStatus}</small>
                  </span>
                </div>
              </td>
              {!compact ? <td className="is-accent">{movie.id.slice(0, 8).toUpperCase()}</td> : null}
              <td>{movie.releaseYear}</td>
              <td>{movie.genres.slice(0, 2).join(", ")}</td>
              <td>
                <span className="cineverse-rating">
                  {movie.rating.toFixed(1)} <Star size={13} fill="currentColor" />
                </span>
              </td>
              <td>
                <span className={clsx("cineverse-status", statusClass(movie.workflowStatus))}>{movie.workflowStatus}</span>
              </td>
              <td>
                <ActionButtons
                  itemLabel={movie.title}
                  onView={onSelectMovie ? () => onSelectMovie(movie.id) : undefined}
                  viewHref={onSelectMovie ? undefined : `/admin/movies?movieId=${movie.id}`}
                  onEdit={onSelectMovie ? () => onSelectMovie(movie.id, "details") : undefined}
                  editHref={onSelectMovie ? undefined : `/admin/movies?movieId=${movie.id}&tab=details`}
                  menuItems={[
                    { label: "Open public page", href: `/movies/${movie.slug}` },
                    { label: "Open reviews tab", href: `/admin/movies?movieId=${movie.id}&tab=reviews` },
                    { label: "Open media tab", href: `/admin/movies?movieId=${movie.id}&tab=media` },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminTitlesView({ data }: { data: AdminSuiteData }) {
  const searchParams = useSearchParams();
  const requestedMovieId = searchParams?.get("movieId") ?? null;
  const requestedTab = searchParams?.get("tab") ?? null;
  const [selectedId, setSelectedId] = useState(
    data.movies.some((movie) => movie.id === requestedMovieId) ? requestedMovieId ?? "" : data.movies[0]?.id ?? "",
  );
  const [activeTab, setActiveTab] = useState<MovieDetailTab>(isMovieDetailTab(requestedTab) ? requestedTab : "overview");

  useEffect(() => {
    if (requestedMovieId && data.movies.some((movie) => movie.id === requestedMovieId)) {
      setSelectedId(requestedMovieId);
    }
  }, [data.movies, requestedMovieId]);

  useEffect(() => {
    if (isMovieDetailTab(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const selected = data.movies.find((movie) => movie.id === selectedId) ?? null;

  function selectMovie(movieId: string, tab: MovieDetailTab = "overview") {
    setSelectedId(movieId);
    setActiveTab(tab);
  }

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total Titles" value={formatNumber(data.movies.length)} detail="All catalogue entries" icon={Film} />
          <AdminMetricCard label="Published" value={formatNumber(data.movies.filter((movie) => movie.workflowStatus === "Published").length)} detail="Visible on site" icon={CheckCircle2} tone="green" />
          <AdminMetricCard label="Drafts" value={formatNumber(data.movies.filter((movie) => movie.workflowStatus === "Draft").length)} detail="Need review" icon={Pencil} tone="blue" />
          <AdminMetricCard label="Avg. Rating" value={`${(data.movies.reduce((sum, movie) => sum + movie.rating, 0) / Math.max(data.movies.length, 1)).toFixed(1)}`} detail="Across all titles" icon={Star} />
        </div>
        <div className="cineverse-toolbar">
          <Link className="cineverse-primary-button" href="/admin/movies/new">
            <Plus size={17} />
            Add New Title
          </Link>
          <button type="button">
            <Upload size={17} />
            Import CSV
          </button>
          <button type="button">
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
        <AdminPanel title="Titles Library" className="cineverse-table-panel">
          <AdminMovieTable movies={data.movies} selectedMovieId={selected?.id} onSelectMovie={selectMovie} />
        </AdminPanel>
      </section>
      {selected ? (
        <MovieDetailPanel
          movie={selected}
          relatedReviews={data.reviews.filter((review) => review.movieSlug === selected.slug)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : null}
    </div>
  );
}

function MovieDetailPanel({
  movie,
  relatedReviews,
  activeTab,
  onTabChange,
}: {
  movie: Movie;
  relatedReviews: Review[];
  activeTab: MovieDetailTab;
  onTabChange: (tab: MovieDetailTab) => void;
}) {
  return (
    <aside className="cineverse-detail-panel" data-testid="movie-detail-panel">
      <header>
        <div>
          <h2>{movie.title} ({movie.releaseYear})</h2>
          <span className={clsx("cineverse-status", statusClass(movie.workflowStatus))}>{movie.workflowStatus}</span>
        </div>
      </header>
      <MovieWideArt movie={movie} />
      <DetailTabs tabs={movieDetailTabs} activeTab={activeTab} onChange={onTabChange} />
      {activeTab === "overview" ? (
        <>
          <dl className="cineverse-facts">
            <div><dt>Type</dt><dd>Movie</dd></div>
            <div><dt>Original Title</dt><dd>{movie.originalTitle ?? movie.title}</dd></div>
            <div><dt>Release Date</dt><dd>{formatDate(movie.releaseDate)}</dd></div>
            <div><dt>Runtime</dt><dd>{Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m</dd></div>
            <div><dt>Country</dt><dd>{movie.country}</dd></div>
            <div><dt>Rating</dt><dd className="is-accent">{movie.rating.toFixed(1)} / 10</dd></div>
          </dl>
          <section>
            <h3>Synopsis</h3>
            <p>{movie.synopsis}</p>
          </section>
          <div className="cineverse-chip-row">
            {movie.genres.map((genre) => <span key={genre}>{genre}</span>)}
          </div>
          <div className="cineverse-media-summary">
            <article><ImageIcon size={18} /><strong>{movie.posterUrl ? 1 : 0}</strong><span>Posters</span></article>
            <article><Camera size={18} /><strong>{movie.galleryImages.length}</strong><span>Stills</span></article>
            <article><Clapperboard size={18} /><strong>{movie.trailerUrl ? 1 : 0}</strong><span>Trailers</span></article>
          </div>
        </>
      ) : null}
      {activeTab === "details" ? (
        <>
          <dl className="cineverse-facts">
            <div><dt>Slug</dt><dd>{movie.slug}</dd></div>
            <div><dt>Director</dt><dd>{movie.director}</dd></div>
            <div><dt>Languages</dt><dd>{movie.languages.join(", ") || "Not set"}</dd></div>
            <div><dt>Public Badge</dt><dd>{movie.status}</dd></div>
            <div><dt>Trend</dt><dd>{movie.trend}</dd></div>
            <div><dt>Editor Pick</dt><dd>{movie.editorPick ? "Featured" : "Not featured"}</dd></div>
          </dl>
          <section>
            <h3>Cast & Crew</h3>
            <p>{movie.cast.length} cast credits and {movie.crew.length} crew credits are linked to this title.</p>
          </section>
          <div className="cineverse-chip-row">
            {movie.languages.map((language) => <span key={language}>{language}</span>)}
          </div>
        </>
      ) : null}
      {activeTab === "media" ? (
        <>
          <dl className="cineverse-facts">
            <div><dt>Poster</dt><dd>{movie.posterUrl ? "Attached" : "Missing"}</dd></div>
            <div><dt>Backdrop</dt><dd>{movie.backdropUrl ? "Attached" : "Missing"}</dd></div>
            <div><dt>Trailer</dt><dd>{movie.trailerUrl ? movie.trailerSourceType : "Missing"}</dd></div>
            <div><dt>Gallery Images</dt><dd>{movie.galleryImages.length}</dd></div>
          </dl>
          <section>
            <h3>Gallery</h3>
            <p>{movie.galleryImages.length > 0 ? "Uploaded stills are ready for review." : "No gallery stills have been uploaded yet."}</p>
          </section>
          <div className="cineverse-chip-row">
            {movie.galleryImages.map((image, index) => <span key={`${image.src}-${index}`}>{image.alt}</span>)}
          </div>
          <Link className="cineverse-primary-button" href={`/admin/movies/new?movieId=${movie.id}`}>
            Review in editor
          </Link>
        </>
      ) : null}
      {activeTab === "reviews" ? (
        <>
          <dl className="cineverse-facts">
            <div><dt>Community Reviews</dt><dd>{movie.reviews}</dd></div>
            <div><dt>Loaded Reviews</dt><dd>{relatedReviews.length}</dd></div>
            <div><dt>Average Rating</dt><dd>{movie.rating.toFixed(1)} / 10</dd></div>
          </dl>
          <section>
            <h3>Latest feedback</h3>
            <p>{relatedReviews.length > 0 ? "The most recent linked reviews are listed below." : "No review entries are linked to this title yet."}</p>
          </section>
          <div className="cineverse-activity-list">
            {relatedReviews.slice(0, 3).map((review) => (
              <article key={review.id}>
                <Star size={18} />
                <div>
                  <strong>{review.title}</strong>
                  <span>{review.author} · {review.rating}/10 · {formatDate(review.publishedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}

export function AdminPeopleView({ data }: { data: AdminSuiteData }) {
  const [selectedId, setSelectedId] = useState(data.people[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<PersonDetailTab>("overview");
  const selected = data.people.find((person) => person.id === selectedId) ?? null;
  const actors = data.people.filter((person) => person.role.toLowerCase().includes("actor"));
  const directors = data.people.filter((person) => person.role.toLowerCase().includes("director"));

  function selectPerson(personId: string, tab: PersonDetailTab = "overview") {
    setSelectedId(personId);
    setActiveTab(tab);
  }

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total People" value={formatNumber(data.people.length)} detail="Profiles in catalogue" icon={Users} />
          <AdminMetricCard label="Actors" value={formatNumber(actors.length)} detail="Cast profiles" icon={Clapperboard} />
          <AdminMetricCard label="Directors" value={formatNumber(directors.length)} detail="Crew profiles" icon={Gauge} tone="blue" />
          <AdminMetricCard label="Pending Approvals" value="0" detail="No profile workflow model" icon={Shield} />
        </div>
        <AdminPanel title="People Directory" className="cineverse-table-panel">
          <div className="cineverse-table-wrap">
            <table className="cineverse-table">
              <thead>
                <tr><th>Person</th><th>Role(s)</th><th>Known For</th><th>Location</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.people.map((person) => (
                  <tr
                    key={person.id}
                    className={clsx("is-selectable", selectedId === person.id && "is-selected")}
                    onClick={() => selectPerson(person.id)}
                  >
                    <td><div className="cineverse-title-cell"><PersonAvatar person={person} /><span><strong>{person.name}</strong><small>{person.slug}</small></span></div></td>
                    <td><span className="cineverse-status is-warning">{person.role}</span></td>
                    <td>{person.knownFor.slice(0, 2).join(", ")}</td>
                    <td>{person.location}</td>
                    <td><span className="cineverse-status is-success">Published</span></td>
                    <td>
                      <ActionButtons
                        itemLabel={person.name}
                        onView={() => selectPerson(person.id)}
                        onEdit={() => selectPerson(person.id, "credits")}
                        menuItems={[
                          { label: "Open media tab", onSelect: () => selectPerson(person.id, "media") },
                          { label: "Open awards tab", onSelect: () => selectPerson(person.id, "awards") },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </section>
      {selected ? (
        <aside className="cineverse-detail-panel">
          <header><div><h2>{selected.name}</h2><span>{selected.role}</span></div></header>
          <PersonAvatar person={selected} size="large" />
          <DetailTabs tabs={personDetailTabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" ? (
            <>
              <section><h3>Biography</h3><p>{selected.bio}</p></section>
              <dl className="cineverse-facts"><div><dt>Known For</dt><dd>{selected.knownFor.join(", ")}</dd></div><div><dt>Location</dt><dd>{selected.location}</dd></div></dl>
            </>
          ) : null}
          {activeTab === "credits" ? (
            <div className="cineverse-activity-list">
              {data.movies
                .filter((movie) => movie.cast.some((credit) => credit.personSlug === selected.slug) || movie.crew.some((credit) => credit.personSlug === selected.slug))
                .map((movie) => (
                  <article key={movie.id}>
                    <Clapperboard size={18} />
                    <div>
                      <strong>{movie.title}</strong>
                      <span>{movie.releaseYear} · {movie.cast.some((credit) => credit.personSlug === selected.slug) ? "Cast" : "Crew"}</span>
                    </div>
                  </article>
                ))}
            </div>
          ) : null}
          {activeTab === "media" ? (
            <dl className="cineverse-facts"><div><dt>Photo</dt><dd>{selected.photoUrl ? "Uploaded" : "Missing"}</dd></div><div><dt>Palette</dt><dd>{selected.palette}</dd></div></dl>
          ) : null}
          {activeTab === "awards" ? (
            <section><h3>Awards tracking</h3><p>Awards and festival history are not modeled for people yet, but this tab now responds and is ready for future data.</p></section>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

export function AdminGenresView({ data }: { data: AdminSuiteData }) {
  const [selectedName, setSelectedName] = useState(data.genres[0]?.name ?? "");
  const [activeTab, setActiveTab] = useState<GenreDetailTab>("overview");
  const selected = data.genres.find((genre) => genre.name === selectedName) ?? null;

  function selectGenre(genreName: string, tab: GenreDetailTab = "overview") {
    setSelectedName(genreName);
    setActiveTab(tab);
  }

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total Genres" value={formatNumber(data.genres.length)} detail="Taxonomy entries" icon={Layers3} />
          <AdminMetricCard label="Active Genres" value={formatNumber(data.genres.filter((genre) => genre.movieCount > 0).length)} detail="Used by titles" icon={CheckCircle2} tone="green" />
          <AdminMetricCard label="Subgenres" value="0" detail="No nested genre model" icon={Tags} tone="purple" />
          <AdminMetricCard label="Hidden Genres" value={formatNumber(data.genres.filter((genre) => genre.movieCount === 0).length)} detail="No visible titles" icon={XCircle} tone="red" />
        </div>
        <div className="cineverse-card-grid">
          {data.genres.map((genre) => (
            <article className="cineverse-genre-card" key={genre.name}>
              <div><Tags size={24} /><span className="cineverse-status is-success">Active</span></div>
              <h3>{genre.name}</h3>
              <p>{formatNumber(genre.movieCount)} titles linked to this taxonomy entry.</p>
              <small>Order {genre.sortOrder}</small>
            </article>
          ))}
        </div>
        <AdminPanel title="Genre Taxonomy" className="cineverse-table-panel">
          <div className="cineverse-table-wrap">
            <table className="cineverse-table">
              <thead><tr><th>Order</th><th>Genre</th><th>Type</th><th>Titles</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.genres.map((genre) => (
                  <tr
                    key={genre.name}
                    className={clsx("is-selectable", selectedName === genre.name && "is-selected")}
                    onClick={() => selectGenre(genre.name)}
                  >
                    <td>{genre.sortOrder}</td>
                    <td className="is-accent">{genre.name}</td>
                    <td>Parent</td>
                    <td>{genre.movieCount}</td>
                    <td><span className="cineverse-status is-success">Active</span></td>
                    <td>
                      <ActionButtons
                        itemLabel={genre.name}
                        onView={() => selectGenre(genre.name)}
                        onEdit={() => selectGenre(genre.name, "titles")}
                        menuItems={[{ label: "Open history tab", onSelect: () => selectGenre(genre.name, "history") }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </section>
      {selected ? (
        <aside className="cineverse-detail-panel">
          <header><div><h2>{selected.name}</h2><span className="cineverse-status is-success">Active</span></div></header>
          <DetailTabs tabs={genreDetailTabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" ? (
            <>
              <section><h3>Description</h3><p>{selected.name} titles are grouped here for catalogue browsing and analytics.</p></section>
              <LineChart values={[2, 5, 7, 4, 5, 6, 8, 7, 9, 10, 9, selected.movieCount + 2]} />
            </>
          ) : null}
          {activeTab === "titles" ? (
            <div className="cineverse-activity-list">
              {data.movies.filter((movie) => movie.genres.includes(selected.name)).map((movie) => (
                <article key={movie.id}>
                  <Film size={18} />
                  <div>
                    <strong>{movie.title}</strong>
                    <span>{movie.releaseYear} · {movie.workflowStatus}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {activeTab === "history" ? (
            <dl className="cineverse-facts"><div><dt>Sort Order</dt><dd>{selected.sortOrder}</dd></div><div><dt>Linked Titles</dt><dd>{selected.movieCount}</dd></div></dl>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

export function AdminReviewsSuiteView({ data }: { data: AdminSuiteData }) {
  const [selectedId, setSelectedId] = useState(data.reviews[0]?.id ?? "");
  const selected = data.reviews.find((review) => review.id === selectedId) ?? null;
  const pending = data.reviews.filter((review) => review.status === "Pending").length;

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total Reviews" value={formatNumber(data.reviews.length)} detail="Community submissions" icon={MessageSquare} />
          <AdminMetricCard label="Flagged Reviews" value="0" detail="No report model yet" icon={Shield} tone="red" />
          <AdminMetricCard label="Pending Moderation" value={formatNumber(pending)} detail="Awaiting review" icon={Activity} />
          <AdminMetricCard label="Avg. Rating" value={`${(data.reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(data.reviews.length, 1)).toFixed(1)} / 10`} detail="Community rating" icon={Star} />
        </div>
        <AdminPanel title="Review Queue" className="cineverse-table-panel">
          <div className="cineverse-table-wrap">
            <table className="cineverse-table">
              <thead><tr><th>Reviewer</th><th>Title Reviewed</th><th>Rating</th><th>Headline</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {data.reviews.map((review) => (
                  <tr
                    key={review.id}
                    className={clsx("is-selectable", selectedId === review.id && "is-selected")}
                    onClick={() => setSelectedId(review.id)}
                  >
                    <td><strong>{review.author}</strong><small>{review.location}</small></td>
                    <td>{review.movieTitle}</td>
                    <td><span className="cineverse-rating">{review.rating}/10 <Star size={13} fill="currentColor" /></span></td>
                    <td>{review.title}</td>
                    <td><span className={clsx("cineverse-status", statusClass(review.status ?? "Published"))}>{review.status}</span></td>
                    <td>{formatDate(review.publishedAt)}</td>
                    <td>
                      <ActionButtons
                        itemLabel={review.title}
                        onView={() => setSelectedId(review.id)}
                        editHref={`/reviews/${review.id}`}
                        menuItems={[
                          { label: "Open public review", href: `/reviews/${review.id}` },
                          { label: "Open movie page", href: `/movies/${review.movieSlug}` },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </section>
      {selected ? (
        <aside className="cineverse-detail-panel">
          <header><div><h2>{selected.title}</h2><span className={clsx("cineverse-status", statusClass(selected.status ?? "Published"))}>{selected.status}</span></div></header>
          <p className="cineverse-rating"><Star size={15} fill="currentColor" /> {selected.rating}/10 by {selected.author}</p>
          <section><h3>{selected.movieTitle}</h3><p>{selected.body}</p></section>
          <div className="cineverse-moderation-actions"><button type="button">Approve</button><button type="button">Hide</button><button type="button">Reject</button></div>
        </aside>
      ) : null}
    </div>
  );
}

export function AdminUsersView({ data }: { data: AdminSuiteData }) {
  const [selectedId, setSelectedId] = useState(data.users[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<UserDetailTab>("overview");
  const selected = data.users.find((user) => user.id === selectedId) ?? null;

  function selectUser(userId: string, tab: UserDetailTab = "overview") {
    setSelectedId(userId);
    setActiveTab(tab);
  }

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total Users" value={formatNumber(data.users.length)} detail="Registered accounts" icon={Users} />
          <AdminMetricCard label="Active Users" value={formatNumber(data.users.length)} detail="No suspension model" icon={CheckCircle2} tone="green" />
          <AdminMetricCard label="Moderators" value={formatNumber(data.users.filter((user) => user.role === "Admin").length)} detail="Admin accounts" icon={Shield} />
          <AdminMetricCard label="Suspended" value="0" detail="Unsupported action" icon={XCircle} tone="red" />
        </div>
        <AdminPanel title="Users" className="cineverse-table-panel">
          <div className="cineverse-table-wrap">
            <table className="cineverse-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Contributions</th><th>Actions</th></tr></thead>
              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.id}
                    className={clsx("is-selectable", selectedId === user.id && "is-selected")}
                    onClick={() => selectUser(user.id)}
                  >
                    <td><strong>{user.username}</strong><small>{user.displayName}</small></td>
                    <td>{user.email ?? "No email"}</td>
                    <td><span className={clsx("cineverse-status", statusClass(user.role))}>{user.role}</span></td>
                    <td><span className="cineverse-status is-success">Active</span></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.reviewCount}</td>
                    <td>
                      <ActionButtons
                        itemLabel={user.displayName}
                        onView={() => selectUser(user.id)}
                        onEdit={() => selectUser(user.id, "activity")}
                        menuItems={[{ label: "Open security tab", onSelect: () => selectUser(user.id, "security") }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </section>
      {selected ? (
        <aside className="cineverse-detail-panel">
          <header><div><h2>{selected.displayName}</h2><span className="cineverse-status is-success">Active</span></div></header>
          <div className="cineverse-user-hero"><div className="cineverse-avatar is-large">{selected.displayName.slice(0, 1)}</div><strong>{selected.username}</strong><span>{selected.email}</span></div>
          <DetailTabs tabs={userDetailTabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" ? (
            <dl className="cineverse-facts"><div><dt>Role</dt><dd>{selected.role}</dd></div><div><dt>Location</dt><dd>{selected.location}</dd></div><div><dt>Reviews</dt><dd>{selected.reviewCount}</dd></div><div><dt>Average Rating</dt><dd>{selected.averageRating.toFixed(1)}</dd></div></dl>
          ) : null}
          {activeTab === "activity" ? (
            <dl className="cineverse-facts"><div><dt>Watched</dt><dd>{selected.watchedCount}</dd></div><div><dt>Updated</dt><dd>{formatDate(selected.updatedAt)}</dd></div><div><dt>Joined</dt><dd>{formatDate(selected.createdAt)}</dd></div></dl>
          ) : null}
          {activeTab === "security" ? (
            <>
              <dl className="cineverse-facts"><div><dt>Email</dt><dd>{selected.email ?? "No email"}</dd></div><div><dt>Role</dt><dd>{selected.role}</dd></div></dl>
              <div className="cineverse-moderation-actions"><button type="button" disabled>Warn User</button><button type="button" disabled>Suspend User</button><button type="button" disabled>Ban User</button></div>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

export function AdminMediaView({ data }: { data: AdminSuiteData }) {
  const assets = data.movies.flatMap((movie) => [
    ...(movie.posterUrl ? [{ id: `${movie.id}-poster`, movie, type: "Poster", src: movie.posterUrl, publicId: movie.posterPublicId }] : []),
    ...(movie.backdropUrl ? [{ id: `${movie.id}-backdrop`, movie, type: "Backdrop", src: movie.backdropUrl, publicId: movie.backdropPublicId }] : []),
    ...movie.galleryImages.map((image, index) => ({ id: `${movie.id}-still-${index}`, movie, type: "Still", src: image.src, publicId: image.publicId })),
    ...(movie.trailerUrl ? [{ id: `${movie.id}-trailer`, movie, type: "Trailer", src: movie.trailerUrl, publicId: movie.trailerPublicId }] : []),
  ]);
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");
  const selected = assets.find((asset) => asset.id === selectedId) ?? null;

  return (
    <div className="cineverse-split-page">
      <section>
        <div className="cineverse-metric-grid is-four">
          <AdminMetricCard label="Total Assets" value={formatNumber(assets.length)} detail="Derived from movie media" icon={ImageIcon} />
          <AdminMetricCard label="Posters" value={formatNumber(assets.filter((asset) => asset.type === "Poster").length)} detail="Primary artwork" icon={FolderOpen} />
          <AdminMetricCard label="Pending Processing" value="0" detail="Cloudinary handles delivery" icon={Gauge} />
          <AdminMetricCard label="Missing Posters" value={formatNumber(data.movies.filter((movie) => !movie.posterUrl).length)} detail="Titles without poster" icon={AlertTriangle} tone="red" />
        </div>
        <div className="cineverse-toolbar"><Link className="cineverse-primary-button" href="/admin/movies/new"><Upload size={17} /> Upload Assets</Link></div>
        <div className="cineverse-media-grid">
          {assets.map((asset) => (
            <article className={clsx("cineverse-asset-card", selectedId === asset.id && "is-selected")} key={asset.id} onClick={() => setSelectedId(asset.id)}>
              <MovieWideArt movie={asset.movie} />
              <span>{asset.type}</span>
              <strong>{asset.movie.title}</strong>
              <small>{asset.publicId ?? "External URL"}</small>
              <ActionButtons
                itemLabel={`${asset.movie.title} ${asset.type}`}
                onView={() => setSelectedId(asset.id)}
                editHref={`/admin/movies?movieId=${asset.movie.id}&tab=media`}
                menuItems={[
                  { label: "Open linked title", href: `/admin/movies?movieId=${asset.movie.id}` },
                  { label: "Open public page", href: `/movies/${asset.movie.slug}` },
                ]}
              />
            </article>
          ))}
        </div>
      </section>
      {selected ? (
        <aside className="cineverse-detail-panel">
          <header><div><h2>Asset Details</h2><span>{selected.type}</span></div></header>
          <MovieWideArt movie={selected.movie} />
          <dl className="cineverse-facts"><div><dt>Linked Title</dt><dd>{selected.movie.title}</dd></div><div><dt>Asset Type</dt><dd>{selected.type}</dd></div><div><dt>Status</dt><dd>Approved</dd></div><div><dt>Public ID</dt><dd>{selected.publicId ?? "External URL"}</dd></div></dl>
          <Link className="cineverse-primary-button" href={`/admin/movies?movieId=${selected.movie.id}&tab=media`}>Replace File</Link>
        </aside>
      ) : null}
    </div>
  );
}

export function AdminAnalyticsView({ data }: { data: AdminSuiteData }) {
  return (
    <div className="cineverse-analytics">
      <div className="cineverse-metric-grid">
        <AdminMetricCard label="Total Page Views" value={`${formatCompact(data.movies.reduce((sum, movie) => sum + movie.reviews * 120, 0))}`} detail="Estimated from reviews" icon={Eye} />
        <AdminMetricCard label="Active Users" value={formatCompact(data.users.length)} detail="Registered users" icon={Users} tone="green" />
        <AdminMetricCard label="Review Activity" value={formatCompact(data.reviews.length)} detail="All reviews" icon={Star} />
        <AdminMetricCard label="Avg. Session Duration" value="05:36" detail="Read-only demo metric" icon={Gauge} />
      </div>
      <div className="cineverse-dashboard-main">
        <AdminPanel title="Page Views Over Time"><LineChart values={[95, 110, 140, 150, 130, 170, 155, 160, 158, 180, 188, 155, 165]} /></AdminPanel>
        <AdminPanel title="Traffic Sources"><DonutLegend items={[{ label: "Organic Search", value: 54, color: "#f8b400" }, { label: "Direct", value: 22, color: "#d9dde2" }, { label: "Referral", value: 12, color: "#ef4444" }, { label: "Social", value: 8, color: "#2fce74" }]} /></AdminPanel>
        <AdminPanel title="Device Breakdown"><DonutLegend items={[{ label: "Desktop", value: 61, color: "#f8b400" }, { label: "Mobile", value: 31, color: "#d9dde2" }, { label: "Tablet", value: 8, color: "#60a5fa" }]} /></AdminPanel>
      </div>
      <AdminPanel title="Top Titles by Engagement" className="cineverse-table-panel"><AdminMovieTable movies={[...data.movies].sort((a, b) => b.reviews - a.reviews).slice(0, 6)} compact /></AdminPanel>
    </div>
  );
}

export function AdminSettingsView({ data }: { data: AdminSuiteData }) {
  const cloudinaryConfigured = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const cards = [
    ["Site Settings", "CINEVERSE MOVIE DATABASE", "Public registration enabled"],
    ["Media & Uploads", cloudinaryConfigured ? "Cloudinary connected" : "Cloudinary configured server-side", "Signed upload endpoint preserved"],
    ["Moderation Rules", `${data.reviews.filter((review) => review.status === "Pending").length} pending reviews`, "Community contributions enabled"],
    ["Email & SMTP", "Environment driven", "Password reset mail preserved"],
    ["API & Integrations", "TMDB / OMDB placeholders", "Read-only settings"],
    ["System Information", "Next.js 15", "PostgreSQL + Prisma"],
  ];

  return (
    <div className="cineverse-settings-grid">
      {cards.map(([title, value, body]) => (
        <AdminPanel title={title} key={title}>
          <div className="cineverse-setting-card">
            <strong>{value}</strong>
            <p>{body}</p>
            <div className="cineverse-toggle-row"><span>Enabled</span><i /></div>
          </div>
        </AdminPanel>
      ))}
      <div className="cineverse-unsaved-bar">
        <AlertTriangle size={24} />
        <div><strong>You have unsaved changes</strong><span>Visual settings controls are read-only in this implementation pass.</span></div>
        <button type="button">Reset Changes</button>
        <button type="button">Save Changes</button>
      </div>
    </div>
  );
}
