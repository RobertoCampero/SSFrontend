const { Client } = require('pg');

const DATABASE_URL = "postgresql://uy7wde0zm4w0xohxobaj:c2lFogBSWEMfv6qD0DMbSjj0sLjD2h@bueslh5yqorgggaig84s-postgresql.services.clever-cloud.com:50013/bueslh5yqorgggaig84s";

async function fixQuotesStatus() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos');

    // Verificar si hay registros con BORRADOR
    console.log('\n📊 Verificando registros con status BORRADOR...');
    const checkResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM quotes 
      WHERE status::text = 'BORRADOR'
    `);
    console.log(`   Encontrados: ${checkResult.rows[0].count} registros`);

    if (checkResult.rows[0].count > 0) {
      // Actualizar usando ALTER TYPE para agregar temporalmente BORRADOR si no existe
      console.log('\n🔧 Agregando BORRADOR temporalmente al enum...');
      try {
        await client.query(`
          ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'BORRADOR'
        `);
        console.log('✓ BORRADOR agregado al enum');
      } catch (e) {
        console.log('⚠️ BORRADOR ya existe en el enum o no se pudo agregar');
      }

      // Ahora actualizar los registros
      console.log('\n📝 Actualizando registros de BORRADOR a PENDIENTE...');
      const updateResult = await client.query(`
        UPDATE quotes 
        SET status = 'PENDIENTE'::"QuoteStatus"
        WHERE status = 'BORRADOR'::"QuoteStatus"
      `);
      console.log(`✓ ${updateResult.rowCount} registros actualizados`);
    }

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('Ahora todos los registros usan PENDIENTE en lugar de BORRADOR');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    await client.end();
  }
}

fixQuotesStatus();
