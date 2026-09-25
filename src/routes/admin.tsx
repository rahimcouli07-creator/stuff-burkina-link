import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [subAdmins, setSubAdmins] = useState<any[]>([])

  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newCanManageAds, setNewCanManageAds] = useState(true)
  const [newCanManageOffers, setNewCanManageOffers] = useState(true)
  const [newCanManageUsers, setNewCanManageUsers] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.email) fetchAdminProfile(session.user.email)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.email) fetchAdminProfile(session.user.email)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchAdminProfile = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle()

      if (error) throw error
      setAdminProfile(data)

      if (data && data.role === 'super_admin') {
        fetchSubAdmins()
      }
    } catch (err: any) {
      console.error("Erreur profil admin:", err.message)
      setError("Accès restreint. Vous n'avez pas les droits d'administration.")
    }
  }

  const fetchSubAdmins = async () => {
    const { data, error } = await supabase.from('admin_users').select('*')
    if (!error && data) {
      setSubAdmins(data)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Identifiants incorrects. Veuillez réessayer.")
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAdminProfile(null)
  }

  const handleAddSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail) return

    const { error } = await supabase.from('admin_users').insert([
      {
        email: newAdminEmail,
        role: 'sub_admin',
        can_manage_ads: newCanManageAds,
        can_manage_offers: newCanManageOffers,
        can_manage_users: newCanManageUsers,
      },
    ])

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message)
    } else {
      alert("Sous-administrateur ajouté avec succès.")
      setNewAdminEmail('')
      fetchSubAdmins()
    }
  }

  const handleDeleteSubAdmin = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet administrateur ?")) return

    const { error } = await supabase.from('admin_users').delete().eq('id', id)
    if (error) {
      alert("Erreur de suppression : " + error.message)
    } else {
      fetchSubAdmins()
    }
  }

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Portail d'Administration</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Email Admin :</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Mot de passe :</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer', width: '100%' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    )
  }

  if (!adminProfile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Accès Refusé</h2>
        <p style={{ color: 'red' }}>{error || "Votre compte n'a pas les privilèges d'administration requis."}</p>
        <button onClick={handleLogout} style={{ marginTop: '10px', padding: '8px 16px' }}>Se déconnecter</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tableau de Bord Admin</h1>
        <button onClick={handleLogout} style={{ padding: '8px 12px' }}>Déconnexion</button>
      </div>

      <p>Connecté en tant que : <strong>{adminProfile.email}</strong> ({adminProfile.role})</p>

      {adminProfile.can_manage_ads && (
        <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
          <h3>Gestion des Publicités</h3>
          <p>Module de gestion des publicités prêt.</p>
        </section>
      )}

      {adminProfile.can_manage_offers && (
        <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
          <h3>Gestion des Offres</h3>
          <p>Module de gestion des offres prêt.</p>
        </section>
      )}

      {adminProfile.role === 'super_admin' && (
        <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
          <h3>Gestion des Sous-Administrateurs</h3>

          <form onSubmit={handleAddSubAdmin} style={{ marginBottom: '20px' }}>
            <h4>Ajouter un Sous-Admin</h4>
            <input
              type="email"
              placeholder="Email du sous-admin"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
              style={{ padding: '8px', width: '220px', marginRight: '10px', marginBottom: '10px' }}
            />
            <div style={{ marginBottom: '10px' }}>
              <label style={{ marginRight: '10px' }}>
                <input
                  type="checkbox"
                  checked={newCanManageAds}
                  onChange={(e) => setNewCanManageAds(e.target.checked)}
                /> Pubs
              </label>
              <label style={{ marginRight: '10px' }}>
                <input
                  type="checkbox"
                  checked={newCanManageOffers}
                  onChange={(e) => setNewCanManageOffers(e.target.checked)}
                /> Offres
              </label>
              <label style={{ marginRight: '10px' }}>
                <input
                  type="checkbox"
                  checked={newCanManageUsers}
                  onChange={(e) => setNewCanManageUsers(e.target.checked)}
                /> Utilisateurs
              </label>
            </div>
            <button type="submit" style={{ padding: '8px 12px' }}>Ajouter</button>
          </form>

          <h4>Liste des administrateurs</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {subAdmins.map((sub) => (
              <li key={sub.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>{sub.email}</strong> - {sub.role} (Pubs: {sub.can_manage_ads ? 'Oui' : 'Non'}, Offres: {sub.can_manage_offers ? 'Oui' : 'Non'}, Users: {sub.can_manage_users ? 'Oui' : 'Non'})
                </span>
                {sub.role !== 'super_admin' && (
                  <button onClick={() => handleDeleteSubAdmin(sub.id)} style={{ color: 'red' }}>Supprimer</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
    }
  
