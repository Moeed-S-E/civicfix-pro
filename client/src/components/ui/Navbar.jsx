import { Leaf } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-8">
        <Link className="flex items-center gap-3" to="/">
          <span className="brand-mark"><Leaf size={21} strokeWidth={2.2} /></span>
          <span className="text-lg font-extrabold tracking-tight">
            CivicFix<span className="text-forest"> Pro</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full items-center justify-center gap-1 rounded-full bg-canvas p-1 sm:order-none sm:w-auto"
        >
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            end
            to="/"
          >
            Community
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            to="/admin"
          >
            Admin
          </NavLink>
        </nav>

        <span className="hidden items-center gap-2 text-sm font-medium text-forest sm:flex">
          <span className="h-2 w-2 rounded-full bg-lime" />
          Your neighborhood, better
        </span>
      </div>
    </header>
  );
}

export default Navbar;
