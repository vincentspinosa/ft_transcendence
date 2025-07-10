CREATE TABLE membres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    date_inscription TEXT NOT NULL,
    matchs_joues INTEGER DEFAULT 0,
    matchs_remportes INTEGER DEFAULT 0,
    points_joues INTEGER DEFAULT 0,
    points_remportes INTEGER DEFAULT 0
);

CREATE TABLE matchs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur1_id INTEGER,
    joueur2_id INTEGER,
    points_joueur1 INTEGER,
    points_joueur2 INTEGER,
    vainqueur INTEGER, -- ID du vainqueur
    FOREIGN KEY (joueur1_id) REFERENCES membres(id),
    FOREIGN KEY (joueur2_id) REFERENCES membres(id),
    FOREIGN KEY (vainqueur) REFERENCES membres(id)
);

CREATE TABLE tournois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre1_id INTEGER,
    membre2_id INTEGER,
    membre3_id INTEGER,
    membre4_id INTEGER,
    match1_id INTEGER,
    match2_id INTEGER,
    finale_id INTEGER,
    FOREIGN KEY (membre1_id) REFERENCES membres(id),
    FOREIGN KEY (membre2_id) REFERENCES membres(id),
    FOREIGN KEY (membre3_id) REFERENCES membres(id),
    FOREIGN KEY (membre4_id) REFERENCES membres(id),
    FOREIGN KEY (match1_id) REFERENCES matchs(id),
    FOREIGN KEY (match2_id) REFERENCES matchs(id),
    FOREIGN KEY (finale_id) REFERENCES matchs(id)
);

CREATE TABLE amities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre1_id INTEGER NOT NULL,
    membre2_id INTEGER NOT NULL,
    FOREIGN KEY (membre1_id) REFERENCES membres(id),
    FOREIGN KEY (membre2_id) REFERENCES membres(id),
    UNIQUE (membre1_id, membre2_id)
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    envoyeur_id INTEGER NOT NULL,
    receveur_id INTEGER NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi TEXT DEFAULT CURRENT_TIMESTAMP, -- Ajout d'une colonne pour la date d'envoi
    FOREIGN KEY (envoyeur_id) REFERENCES membres(id),
    FOREIGN KEY (receveur_id) REFERENCES membres(id)
);

CREATE TABLE demandes_amis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre_qui_demande INTEGER NOT NULL,
    membre_demande_en_ami INTEGER NOT NULL,
    FOREIGN KEY (membre_qui_demande) REFERENCES membres(id),
    FOREIGN KEY (membre_demande_en_ami) REFERENCES membres(id),
    UNIQUE (membre_qui_demande, membre_demande_en_ami)
);

CREATE TABLE utilisateurs_bloques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre_qui_bloque INTEGER NOT NULL,
    membre_bloque INTEGER NOT NULL,
    FOREIGN KEY (membre_qui_bloque) REFERENCES membres(id),
    FOREIGN KEY (membre_bloque) REFERENCES membres(id),
    UNIQUE (membre_qui_bloque, membre_bloque)
);

CREATE TABLE matchs_morpion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membre1_id INTEGER NOT NULL,
    membre2_id INTEGER NOT NULL,
    vainqueur_id INTEGER NOT NULL, -- ID du vainqueur du morpion
    FOREIGN KEY (membre1_id) REFERENCES membres(id),
    FOREIGN KEY (membre2_id) REFERENCES membres(id),
    FOREIGN KEY (vainqueur_id) REFERENCES membres(id)
);