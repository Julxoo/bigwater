# Configuration du Storage Supabase

## Problème identifié

L'erreur `Bucket not found` indique que le bucket "photos" n'existe pas dans votre projet Supabase.

## Solution : Créer le bucket "photos"

### Méthode 1 : Via le Dashboard Supabase (Recommandée)

1. **Connectez-vous** à votre [Dashboard Supabase](https://app.supabase.com)
2. **Sélectionnez** votre projet BigWater
3. **Naviguez** vers Storage dans la barre latérale
4. **Cliquez** sur "New Bucket"
5. **Configurez** le bucket :

   - **Nom** : `photos`
   - **Public** : ✅ Coché (pour que les images soient accessibles publiquement)
   - **File size limit** : `5MB` (optionnel)
   - **Allowed MIME types** : `image/jpeg,image/png,image/gif,image/webp` (optionnel)

6. **Cliquez** sur "Create Bucket"

### Méthode 2 : Via SQL (Alternative)

Exécutez cette requête SQL dans l'éditeur SQL de votre Dashboard :

```sql
-- Créer le bucket photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

-- Politique pour permettre la lecture publique
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

### Vérification

Une fois le bucket créé, vous pouvez :

1. **Vérifier** dans Storage > Buckets que le bucket "photos" apparaît
2. **Tester** l'upload d'une image depuis votre application
3. **Voir** les images uploadées dans Storage > photos

## Politiques de sécurité recommandées

Pour un bucket public avec upload authentifié :

```sql
-- Lecture publique (pour afficher les images)
CREATE POLICY "Public read" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

-- Upload pour les utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
);
```

## Test de fonctionnement

Après avoir créé le bucket, votre API d'upload devrait fonctionner correctement et vous devriez voir :

```
✓ Photo uploadée vers Supabase Storage
✓ URL publique générée
✓ Message envoyé avec succès avec la photo
```
