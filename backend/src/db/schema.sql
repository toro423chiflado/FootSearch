-- ============================================================
--  FootSearch — Esquema relacional (PostgreSQL)
--  Se ejecuta automáticamente al crear el contenedor de Docker.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Códigos de club (IDs de un solo uso) ----------
-- Pool de 1000 códigos complejos generados por el seed. Cada código
-- solo sirve para registrar UN club; al usarse queda marcado.
CREATE TABLE IF NOT EXISTS codigos_club (
  codigo      VARCHAR(40) PRIMARY KEY,
  usado       BOOLEAN NOT NULL DEFAULT false,
  usado_por   UUID,                          -- club que lo consumió
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Clubes ----------
CREATE TABLE IF NOT EXISTS clubes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(40)  NOT NULL UNIQUE,   -- código de club consumido
  nombre      VARCHAR(120) NOT NULL,
  ciudad      VARCHAR(80),
  fundado     INTEGER,
  color       VARCHAR(9)   DEFAULT '#E2231A',
  iniciales   VARCHAR(4),
  descripcion TEXT,
  foto_perfil   VARCHAR(255),                 -- escudo
  foto_portada  VARCHAR(255),                 -- imagen de fondo
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Usuarios ----------
CREATE TYPE tipo_usuario AS ENUM ('jugador', 'cazatalentos', 'club');

CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo        VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tipo          tipo_usuario NOT NULL,
  nombre        VARCHAR(160) NOT NULL,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Perfil de jugador ----------
CREATE TABLE IF NOT EXISTS jugadores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres         VARCHAR(80),                 -- nombres de pila
  apellido_paterno VARCHAR(60),
  apellido_materno VARCHAR(60),
  nacionalidad    VARCHAR(60),
  fecha_nacimiento DATE,
  posicion        VARCHAR(60),
  estatura_cm     INTEGER,
  peso_kg         INTEGER,
  pierna          VARCHAR(12),
  ciudad          VARCHAR(80),
  club_id         UUID REFERENCES clubes(id) ON DELETE SET NULL,
  disponible      BOOLEAN NOT NULL DEFAULT true,
  profesional     BOOLEAN NOT NULL DEFAULT false,
  bio             TEXT,
  contacto        VARCHAR(160),
  celular         VARCHAR(30),
  foto_perfil     VARCHAR(255),               -- foto de perfil
  foto_portada    VARCHAR(255),               -- foto de portada
  -- Estadísticas: solo editables por endpoint admin. Arrancan en 0.
  partidos        INTEGER NOT NULL DEFAULT 0,
  goles           INTEGER NOT NULL DEFAULT 0,
  asistencias     INTEGER NOT NULL DEFAULT 0,
  minutos         INTEGER NOT NULL DEFAULT 0,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Perfil de cazatalentos ----------
CREATE TABLE IF NOT EXISTS cazatalentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  club_id     UUID REFERENCES clubes(id) ON DELETE SET NULL
);

-- ---------- Vínculo cuenta-club ----------
CREATE TABLE IF NOT EXISTS cuentas_club (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  club_id     UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE
);

-- ---------- Favoritos ----------
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  jugador_id   UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, jugador_id)
);

-- ---------- Logros ----------
CREATE TABLE IF NOT EXISTS logros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id  UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL
);

-- ---------- Convocatorias ----------
CREATE TABLE IF NOT EXISTS convocatorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Índices ----------
CREATE INDEX IF NOT EXISTS idx_jugadores_posicion   ON jugadores(posicion);
CREATE INDEX IF NOT EXISTS idx_jugadores_disponible  ON jugadores(disponible);
CREATE INDEX IF NOT EXISTS idx_jugadores_profesional ON jugadores(profesional);
CREATE INDEX IF NOT EXISTS idx_jugadores_club        ON jugadores(club_id);
CREATE INDEX IF NOT EXISTS idx_codigos_usado         ON codigos_club(usado);

-- ---------- Regla: máximo 52 jugadores por club ----------
CREATE OR REPLACE FUNCTION verificar_cupo_club()
RETURNS TRIGGER AS $$
DECLARE total INTEGER;
BEGIN
  IF NEW.club_id IS NOT NULL THEN
    SELECT COUNT(*) INTO total FROM jugadores
    WHERE club_id = NEW.club_id AND id <> COALESCE(NEW.id, gen_random_uuid());
    IF total >= 52 THEN
      RAISE EXCEPTION 'El club ya alcanzó el cupo máximo de 52 jugadores';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cupo_club ON jugadores;
CREATE TRIGGER trg_cupo_club
  BEFORE INSERT OR UPDATE OF club_id ON jugadores
  FOR EACH ROW EXECUTE FUNCTION verificar_cupo_club();
