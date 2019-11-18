'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");

async function run() {

    let oracleConnection;
    let sql, binds, options, result;


    try {
        // Get a non-pooled connection
        oracleConnection = await oracledb.getConnection(dbConfig);
        console.log('Connection to Oracle was successful!');

        await oracleConnection.execute(`alter session set current_schema = "ORPHEA"`);

        // Query the data
        binds = {};

        // For a complete list of options see the documentation.
        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT ,  // query result format
            // extendedMetaData: true,   // get extra metadata
            // fetchArraySize: 100       // internal buffer allocation size for tuning
        };
		
		
		let chutiers = await oracleConnection.execute('select id_chutier, nbimages, nom from (select * from chutier order by nbimages desc) where rownum <= 10', binds, options);
		//console.log(chutiers.rows);
		
		for (const chutier of chutiers.rows) {
			//console.log(`${chutier.ID_CHUTIER}  |  ${chutier.NOM}  |  ${chutier.NBIMAGES}`);
			console.log(`#${chutier.ID_CHUTIER}  |  ${chutier.NOM}  |  ${chutier.NBIMAGES}`);
			result = await oracleConnection.execute(`select id_objet from CONTAINS_OBJECTS where id_chutier = ${chutier.ID_CHUTIER}`, binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${chutier.ID_CHUTIER}  |  ${chutier.NOM}  |  ${chutier.NBIMAGES}\n`);
		}

		let liasses = await oracleConnection.execute('select id_liasse, lib_liasse, nb_documents from (select * from liasses order by nb_documents desc) where rownum <= 10', binds, options);
		//console.log(liasses.rows);
		
		for (const liasse of liasses.rows) {
			console.log(`#${liasse.ID_LIASSE}  |  ${liasse.LIB_LIASSE}  |  ${liasse.NB_DOCUMENTS}`);
			result = await oracleConnection.execute(`select id_objet from objets where id_liasse = ${liasse.ID_LIASSE}`, binds, options);
			result.rows.map(function (row) { console.log(row.ID_OBJET); })
			console.log(`#/${liasse.ID_LIASSE}  |  ${liasse.LIB_LIASSE}  |  ${liasse.NB_DOCUMENTS}`);
		}
       


    } catch (err) {
        console.error(err);
    } finally {
        if (oracleConnection) {
            try {
                await oracleConnection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();