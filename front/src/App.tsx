import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { I18nProvider } from './i18n/I18nProvider'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { HelpPage } from './pages/HelpPage'
import { HomePage } from './pages/HomePage'
import { PreferencesPage } from './pages/PreferencesPage'
import { SwipePage } from './pages/SwipePage'
import { Top8Page } from './pages/Top8Page'
import { UniversityPage } from './pages/UniversityPage'

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RedirectIfAuthenticated />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/top8" element={<Top8Page />} />
                <Route path="/swipe" element={<SwipePage />} />
                <Route path="/preferences" element={<PreferencesPage />} />
                <Route path="/universities/:id" element={<UniversityPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
