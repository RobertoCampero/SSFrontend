-- Migración: Cambiar BORRADOR a PENDIENTE en el enum QuoteStatus
-- Fecha: 2026-03-16
-- Descripción: Renombra el estado BORRADOR a PENDIENTE para reflejar que son cotizaciones pendientes de aceptar

-- Paso 1: Actualizar todos los registros existentes que tengan status 'BORRADOR' a 'PENDIENTE'
UPDATE quotes 
SET status = 'PENDIENTE' 
WHERE status = 'BORRADOR';

-- Paso 2: Modificar el enum para cambiar BORRADOR por PENDIENTE
-- Nota: En PostgreSQL, no se puede renombrar un valor de enum directamente
-- Necesitamos crear un nuevo enum y migrar

-- Crear nuevo enum con PENDIENTE
CREATE TYPE "QuoteStatus_new" AS ENUM ('PENDIENTE', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');

-- Actualizar la columna para usar el nuevo enum
ALTER TABLE quotes 
  ALTER COLUMN status TYPE "QuoteStatus_new" 
  USING status::text::"QuoteStatus_new";

-- Eliminar el enum antiguo
DROP TYPE "QuoteStatus";

-- Renombrar el nuevo enum al nombre original
ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus";
