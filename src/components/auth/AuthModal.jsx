import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import ResetPasswordForm from './ResetPasswordForm'

function AuthModal() {
  const { authModal, closeAuthModal } = useAuth()
  const modalRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && authModal.isOpen) {
        closeAuthModal()
      }
    }

    if (authModal.isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [authModal.isOpen, closeAuthModal])

  if (!authModal.isOpen) return null

  function handleOverlayClick(event) {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      closeAuthModal()
    }
  }

  const titles = {
    login: {
      title: (
        <>
          Iniciar <em>sesión</em>
        </>
      ),
      subtitle: 'Accede a tu cuenta para continuar tu viaje en PokéGuide.',
    },
    register: {
      title: (
        <>
          Crear <em>cuenta</em>
        </>
      ),
      subtitle: 'Únete para guardar tu progreso y gestionar tu equipo Pokémon.',
    },
    'forgot-password': {
      title: (
        <>
          Recuperar <em>contraseña</em>
        </>
      ),
      subtitle: 'Ingresa tu correo y te enviaremos instrucciones de recuperación.',
    },
    'reset-password': {
      title: (
        <>
          Nueva <em>contraseña</em>
        </>
      ),
      subtitle: 'Define una nueva contraseña de al menos 8 caracteres.',
    },
  }

  const currentInfo = titles[authModal.view] || titles.login

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="auth-modal-card" ref={modalRef}>
        <div className="auth-modal-header">
          <div>
            <div className="auth-brand-badge">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span className="brand-text">PokéGuide</span>
            </div>
            <h2 id="auth-modal-title" className="auth-modal-title">
              {currentInfo.title}
            </h2>
            <p className="auth-modal-subtitle">{currentInfo.subtitle}</p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeAuthModal}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {authModal.view === 'login' && <LoginForm />}
        {authModal.view === 'register' && <RegisterForm />}
        {authModal.view === 'forgot-password' && <ForgotPasswordForm />}
        {authModal.view === 'reset-password' && <ResetPasswordForm />}
      </div>
    </div>
  )
}

export default AuthModal
