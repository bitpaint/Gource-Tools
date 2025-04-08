import db from './database';
import { v4 as uuidv4 } from 'uuid';
import { defaultGourceProfile } from './defaultGourceProfile';

/**
 * Initialise un profil Gource par défaut si aucun n'existe déjà
 */
export function initDefaultGourceProfile() {
  // Vérifier si un profil global par défaut existe déjà
  db.get('SELECT COUNT(*) as count FROM gource_profiles WHERE is_global = 1 AND is_default = 1', [], (err, row: any) => {
    if (err) {
      console.error('Erreur lors de la vérification des profils Gource par défaut:', err.message);
      return;
    }
    
    // Si aucun profil par défaut n'existe, en créer un
    if (row.count === 0) {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // Générer les clés et valeurs pour l'insertion
      const profileData = {
        id,
        created_at: now,
        updated_at: now,
        ...defaultGourceProfile
      };
      
      const keys = Object.keys(profileData);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => (profileData as any)[key]);
      
      const query = `INSERT INTO gource_profiles (${keys.join(', ')}) VALUES (${placeholders})`;
      
      db.run(query, values, function(err) {
        if (err) {
          console.error('Erreur lors de la création du profil Gource par défaut:', err.message);
          return;
        }
        
        console.log('Profil Gource par défaut créé avec succès, ID:', id);
      });
    } else {
      console.log('Un profil Gource par défaut existe déjà');
    }
  });
} 