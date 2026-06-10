# Guide démo AsblOS

> Objectif : présenter l'app à une ASBL en **30 minutes**, sans message technique visible.

## Avant la démo (checklist)

- [ ] Migrations **001 → 036** appliquées ([supabase/INSTALL.md](./supabase/INSTALL.md))
- [ ] App déployée ou `npm run dev:clean` en local
- [ ] Comptes de test créés (voir ci-dessous)
- [ ] Parcours testé **2 fois** la veille
- [ ] `npm run test:e2e` vert (ou au minimum `e2e/demo-smoke.spec.ts`)

## Comptes recommandés

| Rôle | Usage démo | Création |
|------|------------|----------|
| **ADMIN** | Toi — guide la démo | Supabase Auth + `signup_source: admin` |
| **TRAVAILLEUR** | Pointage Mon service | `/equipe/membres` → Ajouter un membre |
| **Parent** | Inscription enfant | `/espace-parents/inscription` |

Utilise des **noms réalistes** (pas « Test Test ») : ex. Marie Dubois, Lucas Martin.

## Scénario 30 min

### 1. Staff — Ma journée (3 min)

1. Connecte-toi en **ADMIN** → `/`
2. Montre le tableau de bord : actions du jour, alertes paiements, soutien scolaire
3. Message clé : *« En un coup d'œil, l'équipe sait quoi traiter. »*

### 2. Enfants & familles (5 min)

1. `/enfants` — liste, fiche enfant, autorisation image / sortie
2. `/administration` — validation lien parent, dossiers soutien scolaire
3. Message clé : *« Fini les fichiers Excel éparpillés. »*

### 3. Équipe & horaires (7 min)

1. `/equipe/membres` — crée un travailleur (mot de passe temporaire)
2. `/equipe/horaires` — objectif 4h45/jour, lun–ven
3. Déconnecte → connecte le **TRAVAILLEUR**
4. `/mon-service` — Commencer → Terminer
5. Reconnecte **ADMIN** → `/equipe/rapport` — heures + solde + export CSV
6. Message clé : *« Pointage mobile + flexibilité horaire automatique. »*

### 4. Espace parents (10 min)

1. `/espace-parents/inscription` — crée un compte parent
2. Inscription enfant (wizard)
3. Paiement (simulation en local si pas Mollie)
4. Inscription à une activité
5. Message clé : *« Les parents font tout en ligne, l'ASBL valide. »*

### 5. Activités & planning (5 min)

1. `/activites` — créer ou ouvrir une activité
2. Marquer les présences
3. `/planning` — vue unifiée
4. Message clé : *« Présences terrain + planning au même endroit. »*

## Phrases à éviter en démo

| ❌ Ne dis pas | ✅ Dis plutôt |
|-------------|---------------|
| « Il faut lancer la migration 034 » | « C'est configuré pour votre ASBL » |
| « Ça marche que en local » | « Voici votre espace en ligne » |
| « Le solde se met à jour au cron » | « Le solde se recalcule chaque nuit automatiquement » |

## Tests automatisés

```bash
# Smoke démo (écrans staff)
npm run test:e2e -- e2e/demo-smoke.spec.ts

# Module pointage complet
npm run test:e2e -- e2e/staff-mon-service.spec.ts
```

## Quand est-ce « prêt à présenter » ?

Tu peux pitcher quand **toute** la checklist du haut est verte et que le scénario 30 min passe **sans t'excuser**.
