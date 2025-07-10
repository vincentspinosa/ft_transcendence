Once at root of directory:

make

Then follow the http link

------------------------------------------------------------------------------

Base de données : 

script de création -> script.sql

Tables : 
- matchs
- membres
- tournois
- amités
- messages
- demandes_amis
- utilisateurs bloques
- matchs_morpion

Matchs :
- id
- joueur1_id (si IA, id à NULL)
- joueur2_id (idem)
- points_joueur1
- points_joueur2
- vainqueur

Membres :
- id
- alias
- mot_de_passe
- email
- date_inscription
- matchs_joues
- matchs_remportes
- points_joues
- points_remportes

Tournois :
- id
- membre1_id (si IA, id à NULL)
- membre2_id (idem)
- membre3_id (idem)
- membre4_id (idem)
- match1 _id
- match2_id
- finale_id

Amitiés :
- id
- membre1_id
- membre2_id

Messages :
- id
- envoyeur_id
- receveur_id
- contenu

Demande_amis :
- id
- Membre_qui_demande
- Membre_demandé_en_ami (retirer l’accent -> les bdd sont seulement ascii normalement)

Utilisateurs_bloques :
- id
- Membre_qui_bloque
- Membre_bloqué (retirer l’accent)

Matchs_morpion :
- id
- membre1_id (pas possible d’être NULL, pas d’IA pour le morpion)
- membre2_id
- vainqueur_id