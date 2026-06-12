# Brevo + Supabase — mot de passe oublié (Phase 1)

Les e-mails de réinitialisation passent par **Supabase Auth**, envoyés via **Brevo SMTP**.

Domaine ASBL : **monasbl.be**

---

## 1. Compte Brevo (gratuit)

1. Crée un compte sur [brevo.com](https://www.brevo.com)
2. **Paramètres → SMTP & API → SMTP**
3. Note :
   - Serveur : `smtp-relay.brevo.com`
   - Port : `587` (TLS)
   - Identifiant : ton login Brevo
   - Mot de passe : clé SMTP générée dans Brevo

---

## 2. Supabase — SMTP custom

Dashboard Supabase → **Project Settings → Authentication → SMTP Settings** :

| Champ | Valeur |
|-------|--------|
| Enable custom SMTP | ✅ |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| User | ton e-mail Brevo |
| Password | clé SMTP Brevo |
| Sender email | `noreply@monasbl.be` (ou une adresse vérifiée chez Brevo) |
| Sender name | `AsblOS` ou nom de l'ASBL |

**Authentication → Email Templates → Reset password** : personnalise le texte en français si tu veux.

---

## 3. URLs autorisées Supabase

**Authentication → URL Configuration** :

| Champ | Valeur prod |
|-------|-------------|
| Site URL | `https://monasbl.be` (ou `https://asblos.vercel.app` en attendant) |
| Redirect URLs | Ajoute **toutes** ces lignes : |

```
http://localhost:3000/auth/callback
https://asblos.vercel.app/auth/callback
https://monasbl.be/auth/callback
https://www.monasbl.be/auth/callback
```

---

## 4. Vercel — variable d'environnement

```
NEXT_PUBLIC_APP_URL=https://monasbl.be
```

(Sinon les liens dans les e-mails pointent vers localhost ou Vercel.)

Redéploie après modification.

---

## 5. DNS monasbl.be (expéditeur crédible)

Dans Brevo → **Domains** → ajoute `monasbl.be` et configure les enregistrements **SPF**, **DKIM** (et **DMARC** si proposé) chez ton registrar DNS.

Sans ça, les e-mails peuvent finir en spam.

---

## 6. Test manuel

1. Va sur `/connexion/mot-de-passe-oublie`
2. Saisis un e-mail de compte existant
3. Vérifie la réception (et les spams)
4. Clique le lien → `/auth/nouveau-mot-de-passe`
5. Définis un nouveau mot de passe → connexion OK

Parents : même flux sur `/espace-parents/mot-de-passe-oublie`.

---

## Phase 2 (plus tard)

- E-mails pro auto `prenom.nom@monasbl.be` à la création staff
- Envoi depuis l'app (API Brevo transactionnelle, pas seulement SMTP Auth)
