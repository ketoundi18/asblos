# Data Dictionary — AsblOS

> **Version :** 1.0 — 6 juin 2026  
> **Source de vérité :** migrations Supabase `001` → `024`  
> **Base :** PostgreSQL (Supabase) · RLS activé sur toutes les tables documentées

---

## Conventions globales

| Élément | Règle |
|---------|--------|
| **Nommage technique** | Tables en anglais (`snake_case`), interface utilisateur en français |
| **Identifiants** | `UUID` générés par `gen_random_uuid()` sauf `profiles.id` (= `auth.users.id`) |
| **Horodatage** | `TIMESTAMPTZ` en UTC (`created_at`, `updated_at`) |
| **Soft delete** | Colonne `deleted_at` sur `children` et `activities` — les lignes ne sont pas supprimées physiquement |
| **Anonymisation RGPD** | `children.anonymized_at` marque une fiche rendue anonyme (données sensibles effacées) |
| **Rôles staff** | `ADMIN`, `TRAVAILLEUR`, `BENEVOLE`, `STAGIAIRE` |
| **Rôle parent** | `PARENT` — espace `/espace-parents/*` uniquement |
| **Helpers RLS** | `is_active_user()`, `get_my_role()`, `is_staff_full()`, `is_staff_limited()`, `is_parent()` |

### Correspondance noms métier ↔ technique

| Nom métier (FR) | Table PostgreSQL |
|-----------------|------------------|
| Profils | `profiles` |
| Enfants | `children` |
| Inscriptions (activités) | `activity_registrations` |
| Activités | `activities` |
| Présences | `activity_attendance` |
| Paiements | `payments` |
| Journal d'audit | `logs_audit` *(spec cible — voir section dédiée)* |

> **Note :** les adhésions annuelles ASBL sont gérées dans la table `memberships` (hors périmètre de ce document, mais liée à `payments` et `children`).

---

## 1. `profiles`

### Description
Compte utilisateur de l'application, lié 1:1 à `auth.users` (Supabase Auth). Stocke le rôle, l'état actif et les métadonnées d'identité.

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | TEXT | ✅ | — | E-mail de connexion (copié depuis Auth) |
| `full_name` | TEXT | ✅ | — | Nom affiché (prénom + nom) |
| `role` | `user_role` | ✅ | `BENEVOLE` | Rôle applicatif (enum) |
| `is_active` | BOOLEAN | ✅ | `true` | Compte désactivé = accès bloqué (middleware + RLS) |
| `phone` | TEXT | ❌ | `NULL` | Téléphone (surtout parents) |
| `signup_source` | TEXT | ❌ | `'admin'` | Origine : `'parent'` force le rôle PARENT |
| `created_at` | TIMESTAMPTZ | ✅ | `now()` | Date de création |
| `updated_at` | TIMESTAMPTZ | ✅ | `now()` | Dernière modification (trigger auto) |

**Enum `user_role` :** `ADMIN` · `TRAVAILLEUR` · `STAGIAIRE` · `BENEVOLE` · `PARENT`

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Compte Auth | `auth.users` | 1:1 |
| Enfants créés | `children.created_by` | 1:N |
| Paiements parent | `payments.parent_id` | 1:N |
| Liens parent-enfant | `parent_child_links.parent_id` | 1:N |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Utilisateur lui-même | `auth.uid() = id` |
| **SELECT** | ADMIN actif | Tous les profils |
| **INSERT** | Système | Trigger `handle_new_user()` à l'inscription Auth |
| **UPDATE** | *(via app / service role)* | Pas de policy UPDATE explicite côté client standard |

### Règles métier

- À l'inscription : `signup_source = 'parent'` (user_metadata) → rôle **PARENT** ; comptes staff via **app_metadata** `signup_source = 'admin'` + `role` (migration 029 — signup public sans metadata = **refusé**).
- Un compte `is_active = false` est bloqué même avec session Auth valide.
- Trigger `on_profile_link_parent` : si e-mail parent = e-mail d'un `guardian`, création auto d'un `parent_child_links` (non vérifié tant que `verified_at` est NULL).

---

## 2. `children` *(enfants)*

### Description
Fiche enfant mineur — cœur métier de l'ASBL. Données médicales, scolaires, autorisations parentales et cycle d'inscription.

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant unique |
| `first_name` | TEXT | ✅ | — | Prénom |
| `last_name` | TEXT | ✅ | — | Nom |
| `birth_date` | DATE | ✅ | — | Date de naissance |
| `school_name` | TEXT | ❌ | `NULL` | École fréquentée |
| `school_class` | TEXT | ❌ | `NULL` | Classe / niveau |
| `allergies` | TEXT | ❌ | `NULL` | Allergies connues |
| `medical_notes` | TEXT | ❌ | `NULL` | Notes médicales |
| `image_rights` | BOOLEAN | ✅ | `false` | Autorisation droit à l'image |
| `image_rights_date` | DATE | ❌ | `NULL` | Date de l'autorisation image |
| `outing_authorization` | BOOLEAN | ✅ | `false` | Autorisation sorties |
| `outing_auth_date` | DATE | ❌ | `NULL` | Date autorisation sorties |
| `emergency_contact_name` | TEXT | ❌ | `NULL` | Contact urgence (nom) |
| `emergency_contact_phone` | TEXT | ❌ | `NULL` | Contact urgence (tél.) |
| `notes` | TEXT | ❌ | `NULL` | Notes internes staff |
| `status` | `child_status` | ✅ | `ACTIF` | Statut vie de la fiche |
| `created_via` | `child_created_via` | ✅ | `STAFF` | Origine : `STAFF` ou `PARENT` |
| `enrollment_status` | `child_enrollment_status` | ✅ | `VALIDE` | Cycle inscription parent (legacy, synchronisé avec `memberships`) |
| `asbl_validated_at` | TIMESTAMPTZ | ❌ | `NULL` | Horodatage validation ASBL |
| `created_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` |
| `updated_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` |
| `created_at` | TIMESTAMPTZ | ✅ | `now()` | Création |
| `updated_at` | TIMESTAMPTZ | ✅ | `now()` | Dernière modification |
| `deleted_at` | TIMESTAMPTZ | ❌ | `NULL` | Soft delete — fiche masquée |
| `anonymized_at` | TIMESTAMPTZ | ❌ | `NULL` | Anonymisation RGPD effectuée |

**Enums :**
- `child_status` : `ACTIF` · `INACTIF` · `ARCHIVE`
- `child_created_via` : `STAFF` · `PARENT`
- `child_enrollment_status` : `BROUILLON` · `EN_ATTENTE_PAIEMENT` · `PAYE_EN_ATTENTE_ASBL` · `VALIDE` · `REFUSE`

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Créateur / modificateur | `profiles` | N:1 |
| Responsables légaux | `guardians` | 1:N |
| Liens parent compte | `parent_child_links` | 1:N |
| Inscriptions activités | `activity_registrations` | 1:N |
| Présences | `activity_attendance` | 1:N |
| Paiements | `payments` | 1:N |
| Adhésions annuelles | `memberships` | 1:N |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Staff complet (`ADMIN`, `TRAVAILLEUR`) | `deleted_at IS NULL` + actif |
| **SELECT** | Staff limité (`BENEVOLE`, `STAGIAIRE`) | Idem (lecture seule métier) |
| **SELECT** | Parent | Enfant lié via `parent_child_links` OU fiche créée par lui (`created_via = PARENT`) |
| **INSERT** | Staff complet | Actif |
| **INSERT** | Parent | `created_by = auth.uid()`, `created_via = PARENT`, statuts `BROUILLON` ou `EN_ATTENTE_PAIEMENT` |
| **UPDATE** | Staff complet | `deleted_at IS NULL` |
| **UPDATE** | Staff complet | Inscriptions parent : validation / refus |
| **UPDATE** | Parent | Uniquement fiches éditables (`my_editable_parent_enrollment_child_ids`) et statuts `BROUILLON` / `EN_ATTENTE_PAIEMENT` |

### Règles métier

- Un parent ne voit **jamais** les enfants d'un autre parent (isolation stricte via `parent_child_links`).
- Fiche staff → `enrollment_status = VALIDE` par défaut.
- Fiche parent → parcours : brouillon → paiement → validation ASBL → `VALIDE`.
- Soft delete : `deleted_at` renseigné, données conservées pour obligations légales puis anonymisation.
- Données médicales : accès staff uniquement, jamais exposées côté parent au-delà du nécessaire.

---

## 3. `activity_registrations` *(inscriptions)*

### Description
Inscription d'un enfant à une activité ponctuelle (sortie, atelier, stage). Distincte de l'adhésion annuelle (`memberships`).

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant |
| `activity_id` | UUID | ✅ | — | FK → `activities(id)` ON DELETE CASCADE |
| `child_id` | UUID | ✅ | — | FK → `children(id)` ON DELETE CASCADE |
| `registered_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` — qui a inscrit |
| `registered_at` | TIMESTAMPTZ | ✅ | `now()` | Date d'inscription |
| `cancelled_at` | TIMESTAMPTZ | ❌ | `NULL` | Annulation (NULL = active) |
| `payment_status` | `activity_registration_payment_status` | ✅ | `NOT_REQUIRED` | État paiement activité |

**Enum `activity_registration_payment_status` :**  
`NOT_REQUIRED` · `PENDING` · `DEFERRED` · `PAID` · `WAIVED`

**Contrainte :** `UNIQUE (activity_id, child_id)` — un enfant ne peut être inscrit qu'une fois par activité.

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Activité | `activities` | N:1 |
| Enfant | `children` | N:1 |
| Inscrit par | `profiles` | N:1 |
| Paiement lié | `payments` | 0:1 via `purpose = ACTIVITY` + `reference_id` |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Staff actif | Toutes |
| **SELECT** | Parent | Enfant dans `my_parent_child_ids()` |
| **INSERT** | Staff complet | Actif |
| **INSERT** | Parent | Enfant **vérifié** (`my_verified_child_ids()`), activité ouverte aux parents |
| **UPDATE** | Staff complet | Actif |

### Règles métier

- Inscription parent possible seulement si `activities.parent_registration_open = true` et statut `PLANIFIEE` ou `EN_COURS`.
- `payment_status = DEFERRED` = report bienveillant (pas de blocage immédiat).
- Annulation : renseigner `cancelled_at` plutôt que supprimer la ligne (traçabilité).
- BENEVOLE / STAGIAIRE : **pas** d'insertion ni modification staff sur les inscriptions.

---

## 4. `activities` *(activités)*

### Description
Événement ou activité organisée par l'ASBL (date, lieu, capacité, tarif optionnel).

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant |
| `title` | TEXT | ✅ | — | Titre de l'activité |
| `description` | TEXT | ❌ | `NULL` | Description détaillée |
| `activity_date` | DATE | ✅ | — | Date de l'activité |
| `start_time` | TIME | ❌ | `NULL` | Heure de début |
| `end_time` | TIME | ❌ | `NULL` | Heure de fin |
| `location` | TEXT | ❌ | `NULL` | Lieu |
| `max_participants` | INT | ❌ | `NULL` | Capacité max (NULL = illimitée) |
| `price_cents` | INT | ✅ | `0` | Tarif en centimes EUR (`0` = gratuit) |
| `parent_registration_open` | BOOLEAN | ✅ | `false` | Visible et inscriptible par les parents |
| `status` | `activity_status` | ✅ | `PLANIFIEE` | État du cycle de vie |
| `created_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` |
| `updated_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` |
| `created_at` | TIMESTAMPTZ | ✅ | `now()` | Création |
| `updated_at` | TIMESTAMPTZ | ✅ | `now()` | Modification |
| `deleted_at` | TIMESTAMPTZ | ❌ | `NULL` | Soft delete |

**Enum `activity_status` :** `PLANIFIEE` · `EN_COURS` · `TERMINEE` · `ANNULEE`

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Inscriptions | `activity_registrations` | 1:N |
| Présences | `activity_attendance` | 1:N |
| Créateur | `profiles` | N:1 |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Staff actif | `deleted_at IS NULL` |
| **SELECT** | Parent | Activité ouverte, non supprimée, statut `PLANIFIEE` ou `EN_COURS` |
| **INSERT** | Staff complet | Actif |
| **UPDATE** | Staff complet | `deleted_at IS NULL` |

### Règles métier

- Seuls ADMIN et TRAVAILLEUR créent ou modifient des activités.
- Parents ne voient que les activités explicitement ouvertes (`parent_registration_open`).
- Soft delete : activité passée masquée sans perte d'historique inscriptions/présences.

---

## 5. `activity_attendance` *(présences)*

### Description
Marquage de présence ou d'absence d'un enfant lors d'une activité. Utilisé en mode terrain par le staff.

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant |
| `activity_id` | UUID | ✅ | — | FK → `activities(id)` ON DELETE CASCADE |
| `child_id` | UUID | ✅ | — | FK → `children(id)` ON DELETE CASCADE |
| `is_present` | BOOLEAN | ✅ | — | `true` = présent, `false` = absent |
| `notes` | TEXT | ❌ | `NULL` | Commentaire (retard, part early…) |
| `marked_by` | UUID | ❌ | `NULL` | FK → `profiles(id)` |
| `marked_at` | TIMESTAMPTZ | ✅ | `now()` | Horodatage du marquage |

**Contrainte :** `UNIQUE (activity_id, child_id)` — une seule ligne présence par enfant et activité.

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Activité | `activities` | N:1 |
| Enfant | `children` | N:1 |
| Marqué par | `profiles` | N:1 |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Tout staff actif | `is_active_user()` |
| **INSERT** | Tout staff actif | Idem — **y compris BENEVOLE et STAGIAIRE** |
| **UPDATE** | Tout staff actif | Idem |

### Règles métier

- Seule table où les rôles limités (bénévole, stagiaire) peuvent **écrire** — adapté au terrain.
- Pas de soft delete : l'historique de présence est une donnée d'audit opérationnelle.
- Recommandé : ne marquer présence que pour enfants inscrits (`activity_registrations`), contrôle applicatif.

---

## 6. `payments` *(paiements)*

### Description
Transactions financières liées à un enfant — cotisation annuelle (`MEMBERSHIP`) ou activité payante (`ACTIVITY`). Intégration Mollie / Stripe.

### Colonnes

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant |
| `child_id` | UUID | ✅ | — | FK → `children(id)` ON DELETE CASCADE |
| `parent_id` | UUID | ✅ | — | FK → `profiles(id)` ON DELETE CASCADE |
| `amount_cents` | INT | ✅ | — | Montant en centimes (> 0) |
| `currency` | TEXT | ✅ | `'EUR'` | Devise ISO |
| `purpose` | `payment_purpose` | ❌ | `NULL` | `MEMBERSHIP` ou `ACTIVITY` |
| `reference_id` | UUID | ❌ | `NULL` | ID de `memberships` ou `activity_registrations` |
| `provider` | `payment_provider` | ❌ | `NULL` | `MOLLIE` ou `STRIPE` |
| `provider_payment_id` | TEXT | ❌ | `NULL` | ID externe (webhook) |
| `method` | `payment_method` | ❌ | `NULL` | `BANCONTACT` · `CARD` · `OTHER` |
| `status` | `payment_status` | ✅ | `PENDING` | État du paiement |
| `paid_at` | TIMESTAMPTZ | ❌ | `NULL` | Date effective du paiement |
| `created_at` | TIMESTAMPTZ | ✅ | `now()` | Création |
| `updated_at` | TIMESTAMPTZ | ✅ | `now()` | Modification |

**Enums :**
- `payment_status` : `PENDING` · `PAID` · `FAILED` · `REFUNDED`
- `payment_purpose` : `MEMBERSHIP` · `ACTIVITY`

**Contrainte :** index unique — un seul paiement `PAID` par `(purpose, reference_id)`.

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Enfant | `children` | N:1 |
| Parent payeur | `profiles` | N:1 |
| Adhésion | `memberships` | N:1 via `reference_id` |
| Inscription activité | `activity_registrations` | N:1 via `reference_id` |

### RLS — Qui peut lire / écrire

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | Parent | `parent_id = auth.uid()` |
| **SELECT** | Staff complet | Actif |
| **INSERT** | Parent | `parent_id = auth.uid()`, `status = PENDING`, enfant lié |
| **UPDATE** | Staff complet | Actif |
| **UPDATE statut PAID** | Service role / webhook | Hors client browser — migration 023 renforce cette règle |

### Règles métier

- Les parents **ne peuvent pas** marquer un paiement comme payé eux-mêmes — transition via webhook Mollie ou staff.
- Montants toujours en **centimes** (évite les erreurs de virgule flottante).
- `0 €` côté adhésion = pas de ligne paiement obligatoire (adhésion directe ACTIVE).
- Traçabilité : conserver `provider_payment_id` pour rapprochement comptable.

---

## 7. `logs_audit` *(journal d'audit)*

> ✅ **Statut : déployé** — migration `025_logs_audit.sql`  
> Écriture via `lib/audit/log-audit.ts` (service role). Lecture réservée aux **ADMIN**.

### Description
Journal append-only des modifications importantes (validation enfant, changement de rôle, paiement confirmé, anonymisation). Alimenté par triggers ou Server Actions.

### Colonnes proposées

| Colonne | Type | Obligatoire | Défaut | Description |
|---------|------|:-----------:|--------|-------------|
| `id` | UUID | ✅ | `gen_random_uuid()` | Identifiant |
| `occurred_at` | TIMESTAMPTZ | ✅ | `now()` | Horodatage de l'événement |
| `actor_id` | UUID | ❌ | `NULL` | FK → `profiles(id)` — NULL si système/webhook |
| `actor_role` | TEXT | ❌ | `NULL` | Rôle au moment de l'action |
| `action` | TEXT | ✅ | — | Ex. `CHILD_VALIDATED`, `PAYMENT_PAID`, `ROLE_CHANGED` |
| `entity_type` | TEXT | ✅ | — | Ex. `children`, `payments`, `profiles` |
| `entity_id` | UUID | ✅ | — | ID de l'enregistrement concerné |
| `metadata` | JSONB | ❌ | `{}` | Diff minimal, IP hashée, contexte |
| `ip_hash` | TEXT | ❌ | `NULL` | Empreinte IP (pas l'IP en clair — RGPD) |

### Relations

| Relation | Table | Cardinalité |
|----------|-------|-------------|
| Acteur | `profiles` | N:1 (optionnel) |
| Entité | *(polymorphe)* | Référence logique |

### RLS proposée

| Action | Qui | Condition |
|--------|-----|-----------|
| **SELECT** | ADMIN actif | Tous les logs |
| **INSERT** | Service role / triggers | Append-only — jamais UPDATE/DELETE côté client |
| **UPDATE / DELETE** | Personne | Interdit (intégrité audit) |

### Règles métier

- Événements minimum à tracer : validation/refus inscription, confirmation paiement, désactivation compte, anonymisation enfant, modification tarif ASBL.
- Rétention recommandée : 24 mois, puis archivage ou purge selon politique RGPD.
- Ne jamais stocker de données médicales ou mots de passe dans `metadata`.

---

## Schéma relationnel simplifié

```
auth.users ──1:1── profiles ──1:N── parent_child_links ──N:1── children
                                      │
profiles ──1:N── payments ──N:1── children
                    │
                    └── reference_id → memberships | activity_registrations

activities ──1:N── activity_registrations ──N:1── children
         └──1:N── activity_attendance ──N:1── children

children ──1:N── guardians
logs_audit ── (polymorphe) → profiles, children, payments…
```

---

## Matrice RLS récapitulative

| Table | Parent | BENEVOLE / STAGIAIRE | TRAVAILLEUR / ADMIN |
|-------|--------|----------------------|---------------------|
| `profiles` | Son profil | Son profil | Tous (ADMIN) |
| `children` | Ses enfants liés | Lecture | Lecture + écriture |
| `activity_registrations` | Ses enfants (inscription si ouvert) | Lecture | Lecture + écriture |
| `activities` | Ouvertes aux parents | Lecture | Lecture + écriture |
| `activity_attendance` | — | Lecture + écriture | Lecture + écriture |
| `payments` | Ses paiements | — | Lecture + écriture |
| `logs_audit` | — | — | Lecture (ADMIN) |

---

## Écarts connus / dette documentaire

1. **`logs_audit`** : déployé (025) — UI admin de consultation à prévoir (Module Rapports).
2. **`memberships`** : modèle v2 des adhésions — complète `children.enrollment_status` (document séparé recommandé).
3. **Soft delete** : présent sur `children` et `activities` uniquement — pas sur `payments` ni `activity_registrations`.
4. **`types/database.ts`** : peut être partiellement en retard vs migrations 016–024 — les migrations SQL restent la source de vérité.
