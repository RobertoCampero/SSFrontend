const { Client } = require('pg');

const DATABASE_URL = "postgresql://uy7wde0zm4w0xohxobaj:c2lFogBSWEMfv6qD0DMbSjj0sLjD2h@bueslh5yqorgggaig84s-postgresql.services.clever-cloud.com:50013/bueslh5yqorgggaig84s";

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos');

    // Paso 1: Actualizar registros existentes usando cast directo
    console.log('\n1. Actualizando registros con status BORRADOR...');
    const updateResult = await client.query(`
      UPDATE quotes 
      SET status = 'PENDIENTE'::"QuoteStatus"
      WHERE status::text = 'BORRADOR'
    `);
    console.log(`✓ ${updateResult.rowCount} registros actualizados`);

    // Paso 2: Crear nuevo enum
    console.log('\n2. Creando nuevo enum QuoteStatus_new...');
    await client.query(`
      CREATE TYPE "QuoteStatus_new" AS ENUM ('PENDIENTE', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA')
    `);
    console.log('✓ Nuevo enum creado');

    // Paso 3: Actualizar columna
    console.log('\n3. Actualizando columna status...');
    await client.query(`
      ALTER TABLE quotes 
        ALTER COLUMN status TYPE "QuoteStatus_new" 
        USING status::text::"QuoteStatus_new"
    `);
    console.log('✓ Columna actualizada');

    // Paso 4: Eliminar enum antiguo
    console.log('\n4. Eliminando enum antiguo...');
    await client.query(`DROP TYPE "QuoteStatus"`);
    console.log('✓ Enum antiguo eliminado');

    // Paso 5: Renombrar nuevo enum
    console.log('\n5. Renombrando nuevo enum...');
    await client.query(`ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus"`);
    console.log('✓ Enum renombrado');

    console.log('\n✅ Migración completada exitosamente!');
    console.log('El estado BORRADOR ha sido cambiado a PENDIENTE');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
