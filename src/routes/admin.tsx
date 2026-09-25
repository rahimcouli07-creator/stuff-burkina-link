import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminProfile = {
  id: string;
  email: string;
  role: string;
  can_manage_ads: boolean;
  can_manage_offers: boolean;
  can_manage_users: boolean;
};

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [subAdmins, setSubAdmins] = useState<AdminProfile[]>([]);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newCanManageAds, setNewCanManageAds] = useState(true);
  const [newCanManageOffers, setNewCanManageOffers] = useState(true);
  const [newCanManageUsers, setNewCanManageUsers] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session?.user?.email) {
        fetchAdminProfile(session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user?.email) {
        fetchAdminProfile(session.user.email);
      } else {
        setAdminProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminProfile = async (userEmail: string) => {
    setError(null);

    const { data, error } = await supabase
      .from("admin_users")
      .select(
        "id,email,role,can_manage_ads,can_manage_offers,can_manage_users",
      )
      .eq("email", userEmail)
      .maybeSingle();

    if (error) {
      console.error("Erreur profil admin:", error.message);
      setAdminProfile(null);
      setError("Impossible de vérifier les droits d'administration.");
      return;
    }

    if (!data) {
      setAdminProfile(null);
      setError("Votre compte n'a pas les droits d'administration.");
      return;
    }

    setAdminProfile(data as AdminProfile);

    if (data.role === "super_admin") {
      fetchSubAdmins();
    }
  };

  const fetchSubAdmins = async () => {
    const { data, error } = await supabase
      .from("admin_users")
      .select(
        "id,email,role,can_manage_ads,can_manage_offers,can_manage_users",
      )
      .order("email");

    if (!error && data) {
      setSubAdmins(data as AdminProfile[]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminProfile(null);
    setSubAdmins([]);
  };

  const handleAddSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail.trim()) {
      return;
    }

    const { error } = await supabase.from("admin_users").insert({
      email: newAdminEmail.trim().toLowerCase(),
      role: "sub_admin",
      can_manage_ads: newCanManageAds,
      can_manage_offers: newCanManageOffers,
      can_manage_users: newCanManageUsers,
    });

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message);
      return;
    }

    alert("Sous-administrateur ajouté avec succès.");

    setNewAdminEmail("");
    setNewCanManageAds(true);
    setNewCanManageOffers(true);
    setNewCanManageUsers(false);

    fetchSubAdmins();
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cet administrateur ?",
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erreur de suppression : " + error.message);
      return;
    }

    fetchSubAdmins();
  };

  if (!session) {
    return (
      <div
        style={{
          maxWidth: "400px",
          margin: "50px auto",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>Portail d'administration</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label>Email Admin :</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Mot de passe :</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 15px",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Accès refusé</h2>

        <p style={{ color: "red" }}>
          {error ||
            "Votre compte n'a pas les privilèges d'administration requis."}
        </p>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
          }}
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <h1>Tableau de bord Admin</h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
          }}
        >
          Déconnexion
        </button>
      </div>

      <p>
        Connecté en tant que : <strong>{adminProfile.email}</strong>{" "}
        ({adminProfile.role})
      </p>

      {adminProfile.can_manage_ads && (
        <section
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Gestion des publicités</h3>
          <p>Module de gestion des publicités.</p>
        </section>
      )}

      {adminProfile.can_manage_offers && (
        <section
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Gestion des services</h3>
          <p>Module de gestion des services.</p>
        </section>
      )}

      {adminProfile.can_manage_users && (
        <section
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Gestion des utilisateurs</h3>
          <p>Module de gestion des utilisateurs.</p>
        </section>
      )}

      {adminProfile.role === "super_admin" && (
        <section
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3>Gestion des sous-administrateurs</h3>

          <form
            onSubmit={handleAddSubAdmin}
            style={{ marginBottom: "20px" }}
          >
            <h4>Ajouter un sous-admin</h4>

            <input
              type="email"
              placeholder="Email du sous-admin"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
              style={{
                padding: "8px",
                width: "220px",
                marginRight: "10px",
                marginBottom: "10px",
              }}
            />

            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={newCanManageAds}
                  onChange={(e) =>
                    setNewCanManageAds(e.target.checked)
                  }
                />{" "}
                Publicités
              </label>

              <label style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={newCanManageOffers}
                  onChange={(e) =>
                    setNewCanManageOffers(e.target.checked)
                  }
                />{" "}
                Services
              </label>

              <label style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={newCanManageUsers}
                  onChange={(e) =>
                    setNewCanManageUsers(e.target.checked)
                  }
                />{" "}
                Utilisateurs
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: "8px 12px",
              }}
            >
              Ajouter
            </button>
          </form>

          <h4>Liste des administrateurs</h4>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
            }}
          >
            {subAdmins.map((sub) => (
              <li
                key={sub.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span>
                  <strong>{sub.email}</strong> - {sub.role}
                  {" · "}
                  Publicités : {sub.can_manage_ads ? "Oui" : "Non"}
                  {" · "}
                  Services : {sub.can_manage_offers ? "Oui" : "Non"}
                  {" · "}
                  Utilisateurs : {sub.can_manage_users ? "Oui" : "Non"}
                </span>

                {sub.role !== "super_admin" && (
                  <button
                    onClick={() => handleDeleteSubAdmin(sub.id)}
                    style={{ color: "red" }}
                  >
                    Supprimer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}