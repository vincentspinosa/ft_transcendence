Once at root of directory:

make

Then follow the http link

------------------------------------------------------------------------------

Base de données : transcendence.db

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
- Membre_demandé_en_ami

Utilisateurs_bloques :
- id
- Membre_qui_bloque
- Membre_bloqué

Matchs_morpion :
- id
- membre1_id (pas possible d’être NULL, pas d’IA pour le morpion)
- membre2_id
- vainqueur_id

------------------------------------------------------------------------------

Finir le module 'jeu en plus' :

-  'Implement user history tracking to record and display individual users’ gameplay statistics.'

	-> garder en mémoire chaque match dans la base de données

	-> pour display, sur la Vue (et non lapage,puisque Single-Page Application) History :

		SELECT * FROM <table matchs morpions> WHERE <colonne id joueur 1> = <id joueur connecté> OR <colonne id joueur 2> = <id joueur connecté>

		et display tous les résultats

- 'Create a matchmaking system to allow users to find opponents and participate in fair and balanced matches'

	-> chaque utilisateur a une note entre 0 et 100, par défaut à 50

	-> si victoire : +1, si défaite : -1

	-> si note == 100 et victoire : ne rien faire, si note == 0 et défaite : ne rien faire

	-> faire les matchs dans l'ordre des notes (meilleure note vs 2ème meilleure note; 3ème meilleure vs 4ème meilleure, etc)

	-> si note égale entre >= 3 utilisateurs : départager selon l'ordre d'inscription

- 'Ensure that user game history and matchmaking data are stored securely and remain up-to-date.'

	-> se fait tout seul si point 1 est bien codé

- 'Optimize the performance and responsiveness of the new game to provide an enjoyable user experience Regularly update and maintain the game to fix bugs, add new features, and enhance gameplay.'

	-> rien à faire

