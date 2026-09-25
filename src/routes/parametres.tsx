import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { supabase } from '../integrations/supabase/client'

export const Route = createFileRoute('/parametres')({
  component: ParametresPage,
})

function ParametresPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError("Erreur lors de la modification : " + error.message)
    } else {
      setMessage("Votre mot de passe a été modifié avec succès !")
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Réglages du Compte</h2>

      <section style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3>Changer le mot de passe</h3>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '15px' }}>
            <label>Nouveau mot de passe :</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Confirmer le nouveau mot de passe :</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer', width: '100%' }}>
            {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </section>
    </div>
  )
    }
    
