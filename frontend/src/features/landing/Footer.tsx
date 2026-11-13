import { Link } from 'react-router-dom'
import { SCHEME_CATEGORIES } from '@/lib/enums'

export default function Footer() {
  return (
    <footer className="bg-[var(--primary)] text-white/70 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--primary)] font-bold text-sm">DI</span>
              </div>
              <span className="text-white font-semibold">DigitalBeneficiary</span>
            </div>
            <p className="text-sm leading-relaxed">
              AI-powered welfare scheme discovery and eligibility platform, built for every citizen.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              {['Home', 'Schemes', 'How It Works', 'Technology', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link to="/" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2 text-sm">
              {SCHEME_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat}>
                  <Link to={`/schemes?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">About</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50">Built under the Digital India initiative</p>
              <p className="text-xs text-white/30 mt-1">© 2026 Digital Beneficiary ID System</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
